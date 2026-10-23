'use strict';
// EEARS (EMI Center booking system) watcher.
//
// The system publishes every session (/api/events) and, per activity type, the rule for when
// booking opens (/api/event-types). So instead of polling for "is it open yet", we compute the
// opening time and hand ntfy a *scheduled* message a few minutes before it. ntfy holds it and
// delivers on time even when GitHub Actions runs late. Each opening has a fixed sequence ID, so
// re-scheduling replaces the pending message instead of adding a duplicate.
//
// Also pushes: sessions that appear after the first run, and spots freed up by cancellations
// in sessions that were full (once per session).

const crypto = require('crypto');
const T = require('../lib/time');
const { blocksForDate } = require('../widget/schedule');

const NTFY_MAX_AHEAD_MIN = 70 * 60; // ntfy.sh accepts delays up to 3 days; keep a margin
const NTFY_MIN_AHEAD_MIN = 2; // ntfy needs ≥ 10 s; don't schedule something about to fire
const RESEND_AFTER_MIN = 12 * 60; // re-send an unchanged reminder this often (in case a send failed)
const MAX_LINES = 8;
const KEEP_PAST_MIN = 24 * 60;

// /api/event-types → { code: { code, name, openRule, cutoffHours, active } }
function normalizeTypes(json) {
  const list = Array.isArray(json) ? json : (json && json.data) || [];
  const out = {};
  for (const t of list) {
    if (!t || !t.code) continue;
    out[t.code] = {
      code: t.code,
      name: t.displayName || t.code,
      openRule: t.openRule || null,
      cutoffHours: Number.isFinite(t.cutoffHours) ? t.cutoffHours : 2,
      active: t.isActive !== false,
    };
  }
  return out;
}

const RULE_TYPES = new Set(['day_before', 'days_before', 'prev_weekday']);

function validRule(rule) {
  return !!rule && typeof rule === 'object' && RULE_TYPES.has(rule.type) && Number.isFinite(rule.hour);
}

// Opening date of a session under a rule, as "YYYY-MM-DD", or null for an unknown rule.
//   day_before / days_before: `days` days before the session date (default 1)
//   prev_weekday: the last `weekday` (0 = Sunday) strictly before the session date
//     (English Club on Wednesday 11/4 with weekday 3 → Wednesday 10/28; confirmed on the site)
function openDateKey(dateKey, rule) {
  if (!validRule(rule)) return null;
  if (rule.type === 'day_before' || rule.type === 'days_before') {
    const days = Number.isFinite(rule.days) ? rule.days : 1;
    return T.addDays(dateKey, -days);
  }
  if (!Number.isInteger(rule.weekday)) return null;
  for (let k = 1; k <= 7; k++) {
    const key = T.addDays(dateKey, -k);
    if (T.weekdayOf(key) === rule.weekday) return key;
  }
  return null;
}

function openAt(dateKey, rule) {
  const key = openDateKey(dateKey, rule);
  return key ? T.at(key, rule.hour * 60 + (rule.minute || 0)) : null;
}

// Class clash: overlapping class → conflict; a class ending shortly before the start → tight.
function classClash(dateKey, startMin, endMin, coursesCfg, sem, tightGapMinutes = 10) {
  if (!coursesCfg) return { conflict: null, tight: null };
  const blocks = blocksForDate(dateKey, coursesCfg, sem);
  const conflict = blocks.find((b) => b.startMin < endMin && startMin < b.endMin) || null;
  const before = blocks.filter((b) => b.endMin <= startMin && startMin - b.endMin < tightGapMinutes);
  const tight = before.length ? before[before.length - 1] : null;
  const label = (b) => b && { course: b.course.short || b.course.name, start: b.start, end: b.end };
  return { conflict: label(conflict), tight: label(tight) };
}

// API event → our session record (or null when it can't be used).
function toSession(e, types, ctx) {
  if (!e || e.id == null || !/^\d{4}-\d{2}-\d{2}$/.test(String(e.date || '')) || !e.startTime) return null;
  const type = types[e.eventType];
  if (!type) return null;
  const custom = validRule(e.customReservationRule) ? e.customReservationRule : null;
  const rule = custom || type.openRule;
  const startMin = T.toMinutes(e.startTime);
  const endMin = e.endTime ? T.toMinutes(e.endTime) : startMin + 60;
  const start = T.at(e.date, startMin);
  const open = openAt(e.date, rule);
  const clash = classClash(e.date, startMin, endMin, ctx.courses, ctx.semester, ctx.cfg.tightGapMinutes);
  return {
    id: e.id,
    type: e.eventType,
    name: type.name,
    date: e.date,
    start: e.startTime,
    end: e.endTime || null,
    location: e.location || null,
    avail: Number.isFinite(e.availableSpots) ? e.availableSpots : null,
    startAt: start,
    openAt: open,
    cutoffAt: new Date(start.getTime() - type.cutoffHours * 3600000),
    clash,
    ruleNote: e.customReservationRule != null && !custom ? '場次有自訂規則但看不懂，先用活動類型的規則' : null,
  };
}

function hash(obj) {
  return crypto.createHash('sha1').update(JSON.stringify(obj)).digest('hex').slice(0, 12);
}

function uniq(list) {
  return [...new Set(list)];
}

function sessionLine(s, opts = {}) {
  const time = s.end ? `${s.start}–${s.end}` : s.start;
  let line = `${T.mdw(s.date)}${time} ${s.name}`;
  if (opts.location && s.location) line += `・${s.location}`;
  if (opts.extra) line += `　${opts.extra}`;
  if (s.clash.tight) line += `\n　⚠︎ ${s.clash.tight.course} ${s.clash.tight.end} 下課，注意別遲到`;
  return line;
}

function limitLines(lines, unit = '場') {
  if (lines.length <= MAX_LINES) return lines;
  return [...lines.slice(0, MAX_LINES), `…還有 ${lines.length - MAX_LINES} ${unit}`];
}

function seqId(open) {
  const p = T.parts(open);
  return `eears-open-${p.dateKey.replace(/-/g, '')}-${T.pad2(p.hh)}${T.pad2(p.mm)}`;
}

// One reminder per opening time, listing every session that opens then.
function openingPayload(open, sessions, cfg) {
  const lead = cfg.remindBeforeMinutes;
  const remind = new Date(open.getTime() - lead * 60000);
  const names = uniq(sessions.map((s) => s.name));
  return {
    title: `${T.hm(open)} 開放預約：${names.join('、')}`,
    message: [...limitLines(sessions.map((s) => sessionLine(s, { location: true }))), `${lead} 分鐘後開放，點開直接到預約頁`].join('\n'),
    click: cfg.bookingUrl,
    tags: ['alarm_clock'],
    priority: 4,
    delay: String(Math.floor(remind.getTime() / 1000)),
    sequence_id: seqId(open),
  };
}

function statusText(s, now) {
  if (!s.openAt) return '';
  if (now < s.openAt) return `${T.md(T.dateKey(s.openAt))} ${T.hm(s.openAt)} 開放`;
  if (now < s.cutoffAt) return s.avail === 0 ? '已額滿' : '現在就能預約';
  return '已截止';
}

function newSessionsPayload(sessions, now, cfg) {
  if (!sessions.length) return null;
  const lines = sessions.map((s) => sessionLine(s, { extra: statusText(s, now) }));
  return {
    title: sessions.length === 1 ? `EEARS 新增場次：${sessions[0].name}` : `EEARS 新增 ${sessions.length} 場活動`,
    message: limitLines(lines).join('\n'),
    click: cfg.bookingUrl,
    tags: ['new'],
    priority: 3,
  };
}

function freedPayload(sessions, cfg) {
  if (!sessions.length) return null;
  const lines = sessions.map((s) => sessionLine(s, { extra: `剩 ${s.avail} 位` }));
  return {
    title: sessions.length === 1 ? `有空位了：${sessions[0].name} ${T.md(sessions[0].date)} ${sessions[0].start}` : `${sessions.length} 場額滿的活動有空位了`,
    message: [...limitLines(lines), '有人取消，先搶先贏'].join('\n'),
    click: cfg.bookingUrl,
    tags: ['eyes'],
    priority: 4,
  };
}

function stateEvent(s) {
  return {
    id: s.id,
    type: s.type,
    date: s.date,
    start: s.start,
    end: s.end,
    location: s.location,
    avail: s.avail,
    openAt: s.openAt ? s.openAt.toISOString() : null,
    conflict: s.clash.conflict ? s.clash.conflict.course : undefined,
  };
}

/**
 * prev: previous activities.json (null on the first run)
 * typesJson / eventsJson: raw API responses
 * ctx: { now, cfg (config/activities.json), courses, semester }
 * → { state, pushes: [{ kind, payload } | { kind, cancel }], summary: [log lines] }
 */
function planActivities(prev, typesJson, eventsJson, ctx) {
  const { now } = ctx;
  const cfg = { remindBeforeMinutes: 5, tightGapMinutes: 10, notifyNewSessions: true, notifyFreedSpots: true, ...ctx.cfg };
  const watched = new Set(cfg.types || ['english_table', 'job_talk', 'english_club', 'other']);
  const types = normalizeTypes(typesJson);
  const list = Array.isArray(eventsJson) ? eventsJson : (eventsJson && eventsJson.data) || [];
  const firstRun = !prev;
  const summary = [];
  const errors = [];
  const pushes = [];

  const sessions = list
    .filter((e) => e && watched.has(e.eventType) && types[e.eventType] && types[e.eventType].active)
    .map((e) => toSession(e, types, { ...ctx, cfg }))
    .filter((s) => s && s.startAt.getTime() >= now.getTime() - KEEP_PAST_MIN * 60000)
    .sort((a, b) => a.startAt - b.startAt || a.id - b.id);
  for (const s of sessions) if (s.ruleNote) errors.push({ source: `event:${s.id}`, message: s.ruleNote, at: now.toISOString() });
  for (const code of watched) {
    if (types[code] && !validRule(types[code].openRule)) {
      errors.push({ source: `type:${code}`, message: `看不懂「${types[code].name}」的開放規則：${JSON.stringify(types[code].openRule)}`, at: now.toISOString() });
    }
  }
  const attendable = (s) => !s.clash.conflict;
  const upcoming = sessions.filter((s) => s.startAt > now);
  summary.push(`  ✓ 場次 ${upcoming.length} 場（${uniq(upcoming.map((s) => s.name)).join('、') || '無'}），衝堂 ${upcoming.filter((s) => !attendable(s)).length} 場`);

  // 1) Scheduled opening reminders.
  const groups = new Map();
  for (const s of upcoming) {
    if (!attendable(s) || !s.openAt || s.openAt <= now) continue;
    const k = s.openAt.toISOString();
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(s);
  }
  const prevScheduled = (prev && prev.scheduled) || {};
  const scheduled = {};
  for (const [k, group] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const open = new Date(k);
    const remind = new Date(open.getTime() - cfg.remindBeforeMinutes * 60000);
    const ahead = (remind - now) / 60000;
    const seq = seqId(open);
    const old = prevScheduled[seq];
    if (ahead > NTFY_MAX_AHEAD_MIN) continue; // too far ahead for ntfy; a later run schedules it
    if (ahead <= NTFY_MIN_AHEAD_MIN) {
      if (old) scheduled[seq] = old; // already at ntfy (or firing now): leave it alone
      continue;
    }
    const payload = openingPayload(open, group, cfg);
    const h = hash({ title: payload.title, message: payload.message, delay: payload.delay });
    const stale = !old || old.hash !== h || now - new Date(old.sentAt) >= RESEND_AFTER_MIN * 60000;
    scheduled[payload.sequence_id] = { remindAt: remind.toISOString(), openAt: k, hash: h, sentAt: stale ? now.toISOString() : old.sentAt, sessions: group.map((s) => s.id) };
    if (stale) {
      pushes.push({ kind: 'activities-open', payload });
      summary.push(`    排程提醒 ${T.mdw(T.dateKey(remind))}${T.hm(remind)}：${payload.title}（${old ? (old.hash !== h ? '內容有變' : '定期重送') : '新的'}）`);
    }
  }
  // A reminder that is still pending at ntfy but no longer matches anything gets cancelled.
  for (const [seq, old] of Object.entries(prevScheduled)) {
    if (scheduled[seq]) continue;
    const remind = new Date(old.remindAt);
    if (remind > now) {
      pushes.push({ kind: 'activities-cancel', cancel: seq });
      summary.push(`    取消提醒 ${seq}（場次已不在）`);
    } else if (now - remind < KEEP_PAST_MIN * 60000) {
      scheduled[seq] = old; // delivered; keep a day so a late duplicate run can't re-send it
    }
  }

  // 2) New sessions (never on the first run, which only sets the baseline).
  const prevById = new Map(((prev && prev.events) || []).map((e) => [e.id, e]));
  if (!firstRun && cfg.notifyNewSessions) {
    const fresh = upcoming.filter((s) => attendable(s) && !prevById.has(s.id));
    const payload = newSessionsPayload(fresh, now, cfg);
    if (payload) {
      pushes.push({ kind: 'activities-new', payload });
      summary.push(`    新場次 ${fresh.length} 場`);
    }
  }

  // 3) Spots freed up in a session that was full (once per session).
  const prevFreed = new Set((prev && prev.freedNotified) || []);
  const liveIds = new Set(sessions.map((s) => s.id));
  const freedNotified = [...prevFreed].filter((id) => liveIds.has(id));
  if (!firstRun && cfg.notifyFreedSpots) {
    const freed = upcoming.filter((s) => {
      const old = prevById.get(s.id);
      return attendable(s) && old && old.avail === 0 && s.avail > 0 && s.openAt && s.openAt <= now && now < s.cutoffAt && !prevFreed.has(s.id);
    });
    const payload = freedPayload(freed, cfg);
    if (payload) {
      pushes.push({ kind: 'activities-freed', payload });
      freedNotified.push(...freed.map((s) => s.id));
      summary.push(`    有空位 ${freed.length} 場`);
    }
  }
  if (firstRun) summary.push('  第一次執行：場次只建立基準（開放預約提醒照常排程）。');

  return {
    state: {
      version: 1,
      updatedAt: now.toISOString(),
      checkedAt: now.toISOString(),
      firstRun,
      source: cfg.apiBase || null,
      types: Object.fromEntries([...watched].filter((c) => types[c]).map((c) => [c, { name: types[c].name, openRule: types[c].openRule, cutoffHours: types[c].cutoffHours, active: types[c].active }])),
      events: sessions.map(stateEvent),
      scheduled,
      freedNotified,
      errors,
    },
    pushes,
    summary,
  };
}

module.exports = {
  normalizeTypes,
  openDateKey,
  openAt,
  classClash,
  seqId,
  openingPayload,
  planActivities,
  NTFY_MAX_AHEAD_MIN,
  RESEND_AFTER_MIN,
};
