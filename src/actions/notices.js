'use strict';
// Notice watcher: merge freshly parsed lists with the previous Pages state and decide what is new.

const T = require('../lib/time');

const MAX_ITEMS = 200;
const OLD_DAYS = 14; // an unseen item dated older than this is recorded quietly (e.g. a pinned old post)
const MAX_PUSH_LINES = 8;

// results: [{ source, items }] or [{ source, error }]; prev: previous notices.json or null (first run).
function mergeNotices(prev, results, now) {
  const nowIso = now.toISOString();
  const today = T.dateKey(now);
  const firstRun = !prev;
  const prevItems = new Map(((prev && prev.items) || []).map((i) => [i.id, i]));
  const baselined = new Set(firstRun ? [] : prev.baselinedSources || []);
  const seen = new Map();
  const newItems = [];
  const errors = [];
  const okSources = [];
  const counts = {};

  for (const r of results) {
    const src = r.source;
    if (r.error) {
      errors.push({ source: src.id, name: src.name, message: String(r.error), at: nowIso });
      continue;
    }
    okSources.push(src.id);
    counts[src.id] = r.items.length;
    // A source we've never fetched successfully only sets a baseline (no flood of pushes).
    const quietSource = firstRun || !baselined.has(src.id);
    for (const it of r.items) {
      if (!it.id) continue;
      if (seen.has(it.id)) {
        const ex = seen.get(it.id);
        if (!ex.sources.includes(src.id)) ex.sources.push(src.id);
        continue;
      }
      const old = prevItems.get(it.id);
      if (old) {
        const sources = old.sources ? old.sources.slice() : [old.source];
        if (!sources.includes(src.id)) sources.push(src.id);
        seen.set(it.id, { ...old, title: it.title || old.title, url: it.url || old.url, date: it.date || old.date || null, sources });
        continue;
      }
      const tooOld = !!it.date && T.diffDays(it.date, today) > OLD_DAYS;
      const item = {
        id: it.id,
        source: src.id,
        group: src.group,
        title: it.title,
        url: it.url,
        date: it.date || null,
        firstSeen: nowIso,
        sources: [src.id],
      };
      if (it.unit) item.unit = it.unit;
      if (quietSource || tooOld) item.quiet = true;
      seen.set(it.id, item);
      if (!item.quiet) newItems.push(item);
    }
  }

  // Keep everything visible right now first, then the most recently seen older items.
  const rest = [...prevItems.values()].filter((i) => !seen.has(i.id));
  const byRecent = (a, b) => String(b.firstSeen || '').localeCompare(String(a.firstSeen || '')) ||
    String(b.date || '').localeCompare(String(a.date || ''));
  const kept = [...[...seen.values()].sort(byRecent), ...rest.sort(byRecent)].slice(0, MAX_ITEMS);
  const items = kept.sort(byRecent).map((i) => {
    const out = { ...i };
    if (!out.sources || out.sources.length <= 1) delete out.sources;
    return out;
  });

  const enabled = new Set(results.map((r) => r.source.id));
  const baselinedSources = [...new Set([...[...baselined].filter((id) => enabled.has(id)), ...okSources])];

  return {
    state: {
      version: 1,
      updatedAt: nowIso,
      checkedAt: nowIso,
      firstRun,
      baselinedSources,
      counts,
      items,
      errors,
    },
    newItems,
  };
}

// Due when the last check is ≥ 25 minutes old (robust to delayed or skipped cron runs).
function noticesDue(prev, now, minMinutes = 25) {
  const t = prev && T.parseTime(prev.checkedAt);
  return !t || now - t >= minMinutes * 60000;
}

function noticesPayload(newItems) {
  if (!newItems || !newItems.length) return null;
  const n = newItems.length;
  const lines = newItems.slice(0, MAX_PUSH_LINES).map((i) => `【${i.group}】${i.title}`);
  if (n > MAX_PUSH_LINES) lines.push(`…還有 ${n - MAX_PUSH_LINES} 則，打開小工具看完整列表`);
  return {
    title: `中山公告 ${n} 則`,
    message: lines.join('\n'),
    click: newItems[0].url,
    tags: ['loudspeaker'],
    priority: 3,
  };
}

module.exports = { MAX_ITEMS, OLD_DAYS, mergeNotices, noticesDue, noticesPayload };
