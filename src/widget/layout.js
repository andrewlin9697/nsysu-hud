'use strict';
// Builds a renderer-independent layout model for each mode and widget size.
// The Scriptable renderer (render-widget.js) and the text preview (render-text.js) both draw this model.
//
// layout  = { family, mode, title, subtitle, symbol, headerRight, sections, glance, footer, refreshAt }
// section = { id, title, titleRight: [seg], rows: [row], tone }
// row     = { icon, iconColor, left: [seg], right: [seg], big, muted, url }
// seg     = { t: text, c: colour token, b: bold }

const T = require('../lib/time');
const M = require('../lib/macro');
const K = require('./stocks');
const F = require('./feeds');
const W = require('./weather');
const { nextBoundary } = require('./mode');

// Space budget in "row units" (one 13 pt row). Medium has no section titles and at most 2 rows per
// section so that more kinds of information fit.
const FAMILY = {
  large: { maxUnits: 16.5, maxSections: 5, titles: true, headerCost: 0.9, sectionCost: 0.9 },
  medium: { maxUnits: 6.5, maxSections: 4, titles: false, headerCost: 0, sectionCost: 0.3, maxRows: 2 },
  small: { glanceItems: 3 },
};

const seg = (t, c, b) => ({ t: String(t), c: c || null, b: !!b });
const row = (o) => ({ icon: null, iconColor: null, left: [], right: [], big: false, muted: false, url: null, ...o });

// ---------------------------------------------------------------- small helpers

function roomSegs(course) {
  return course.roomChanged ? [seg(`${course.room} ⚠︎`, 'orange')] : [seg(course.room || '', 'secondary')];
}

function classRow(block, opts = {}) {
  const c = block.course;
  const time = opts.range ? `${block.start}–${block.end}` : block.start;
  return row({
    icon: 'book',
    iconColor: 'secondary',
    left: [seg(time, 'secondary'), seg(` ${c.short || c.name}`, opts.muted ? 'secondary' : null, !opts.muted)],
    right: roomSegs(c),
    muted: !!opts.muted,
    big: !!opts.big,
  });
}

function countdownRow(item) {
  return row({
    icon: item.kind === 'exam' ? 'pencil.circle.fill' : 'clock.fill',
    iconColor: item.uncertain ? 'gray' : item.color === 'secondary' ? 'secondary' : item.color,
    left: [seg(item.display, item.uncertain ? 'gray' : null)],
    right: [seg(item.label || '', item.color, item.color === 'red' || item.color === 'orange')],
  });
}

function youbikeRow(ctx, stationNo) {
  if (!stationNo) return null;
  const feed = ctx.youbike.feed;
  const st = ctx.youbike.map[stationNo];
  const cfgSt = ((ctx.cfg.youbike && ctx.cfg.youbike.stations) || []).find((s) => s.no === stationNo);
  const name = F.shortStationName((st && st.name) || (cfgSt && cfgSt.name) || stationNo);
  if (!st || st.bikes == null) {
    return row({ icon: 'bicycle', iconColor: 'secondary', left: [seg(`${name} YouBike 資料暫缺`, 'secondary')], muted: true });
  }
  const stale = F.isStationStale(st, feed, ctx.now);
  const upd = F.stationUpdatedAt(st, feed);
  const suspended = st.status != null && st.status !== 1;
  return row({
    icon: 'bicycle',
    iconColor: 'secondary',
    left: [
      seg(`${name} `, 'secondary'),
      seg(suspended ? '暫停營運' : `可借 ${st.bikes}`, st.bikes <= 2 && !suspended ? 'orange' : null, true),
      seg(suspended ? '' : ` · 可還 ${st.docks}`, 'secondary'),
    ],
    right: stale && upd ? [seg(`${T.hm(upd)} 的資料`, 'gray')] : [],
    muted: stale,
  });
}

function pinnedRow(ctx, opts = {}) {
  const s = ctx.stocks;
  const left = [];
  for (const q of s.pinned) {
    const pct = opts.weekly ? s.weekly[q.code] : q.changePct;
    left.push(seg(`${q.name} `), seg(K.formatPrice(q.price), null, true), seg(' '), seg(K.formatPct(pct), K.trendColor(pct)), seg('　'));
  }
  if (s.index) {
    const pct = opts.weekly ? s.weekly[s.index.code] : s.index.changePct;
    left.push(seg('加權 '), seg(K.formatPrice(Math.round(s.index.price)), null, true), seg(' '), seg(K.formatPct(pct), K.trendColor(pct)));
  }
  if (!left.length) return null;
  if (left[left.length - 1].t === '　') left.pop();
  return row({ left, right: opts.right || [], muted: s.stale && s.status.open });
}

function themeRow(sum) {
  if (!sum || sum.avg == null) return row({ left: [seg(sum ? sum.name : '—', 'secondary')], right: [seg('沒有資料', 'gray')] });
  const right = [];
  if (sum.top) right.push(seg(`${sum.top.name} `, 'secondary'), seg(K.formatPct(sum.top.value, 1), K.trendColor(sum.top.value)));
  if (sum.bottom) right.push(seg(`  ${sum.bottom.name} `, 'secondary'), seg(K.formatPct(sum.bottom.value, 1), K.trendColor(sum.bottom.value)));
  return row({ left: [seg(sum.name), seg(` ${K.formatPct(sum.avg)}`, K.trendColor(sum.avg), true)], right });
}

function weatherNowRow(ctx) {
  const w = ctx.weather;
  const cur = w.current;
  const day = w.today;
  if (!cur && !day) return null;
  const left = [];
  if (cur && cur.temp != null) left.push(seg(`${Math.round(cur.temp)}°`, null, true), seg(` ${cur.text}`));
  else if (day) left.push(seg(day.text, null, true));
  if (day && day.min != null && day.max != null) left.push(seg(` · ${Math.round(day.min)}°–${Math.round(day.max)}°`, 'secondary'));
  const right = [];
  if (cur && cur.apparent != null && Math.abs(cur.apparent - cur.temp) >= 2) right.push(seg(`體感 ${Math.round(cur.apparent)}°`, 'secondary'));
  if (w.stale && w.fetchedAt) right.push(seg(` ${T.hm(w.fetchedAt)} 的資料`, 'gray'));
  return row({ icon: (cur || day).symbol, iconColor: 'secondary', left, right, muted: w.stale });
}

function umbrellaRow(u, muted, dayWord) {
  if (!u) return null;
  if (u.need) {
    const pop = u.peak && u.peak.pop != null ? `（${u.peak.pop}%）` : '';
    return row({
      icon: 'umbrella.fill',
      iconColor: 'orange',
      left: [seg(`${dayWord || ''}要帶傘`, 'orange', true), seg(` · ${W.rangeText(u.range)} 最可能下雨${pop}`, 'secondary')],
      muted,
    });
  }
  const peak = u.peak && u.peak.pop != null ? ` · 降雨機率最高 ${u.maxPop}%（${T.hm(u.peak.time)}）` : '';
  return row({ icon: 'umbrella', iconColor: 'secondary', left: [seg(`${dayWord || ''}不用帶傘`), seg(peak, 'secondary')], muted });
}

function sunRow(ctx) {
  const s = ctx.weather.sun;
  if (!s) return null;
  return row({ icon: 'sun.max.fill', iconColor: s.kind === 'strong' ? 'orange' : 'yellow', left: [seg(s.text, s.kind === 'strong' ? 'orange' : null)] });
}

function weatherMissingRow() {
  return row({ icon: 'cloud', iconColor: 'gray', left: [seg('天氣暫時抓不到', 'gray')], muted: true });
}

function examListRows(list, max = 4) {
  if (!list || !list.length) return [row({ left: [seg('行事曆裡沒有這週的考試', 'secondary')], muted: true })];
  return list.slice(0, max).map((e) => row({
    icon: 'pencil.circle.fill',
    iconColor: e.uncertain ? 'gray' : e.color,
    left: [seg(T.mdw(e.startKey), 'secondary'), seg(` ${e.display}`, e.uncertain ? 'gray' : null)],
    right: [seg(e.label, e.color, !e.uncertain)],
  }));
}

// Countdown items not already shown in the red 48-hour alert.
function listItems(ctx) {
  const shown = new Set(ctx.countdown.alerts.slice(0, 2));
  return ctx.countdown.items.filter((e) => !shown.has(e));
}

function examWeekTitle(exam) {
  return exam ? `本週考試（${exam.label}）` : '本週考試';
}

// ---------------------------------------------------------------- sections

function alertSection(ctx) {
  const a = ctx.countdown.alerts;
  if (!a.length) return null;
  return {
    id: 'alert',
    title: '48 小時內考試',
    tone: 'alert',
    rows: a.slice(0, 2).map((e) => row({
      icon: 'exclamationmark.triangle.fill',
      iconColor: 'red',
      left: [seg(e.display, 'red', true)],
      right: [seg(e.label, 'red', true)],
    })),
  };
}

function weatherTodaySection(ctx, title = '今天天氣') {
  const w = ctx.weather;
  if (!w.ok) return { id: 'weather', title, rows: [weatherMissingRow()] };
  const rows = [weatherNowRow(ctx), umbrellaRow(w.umbrellaToday, w.stale), sunRow(ctx)].filter(Boolean);
  return { id: 'weather', title, rows };
}

function scheduleTodaySection(ctx) {
  if (!ctx.todayInfo.classDay) return null;
  if (ctx.exams.today) {
    return { id: 'exams', title: examWeekTitle(ctx.exams.today), rows: examListRows(ctx.exams.todayWeek) };
  }
  const blocks = ctx.status.blocks;
  if (!blocks.length) return { id: 'schedule', title: '今日課表', rows: [row({ left: [seg('今天沒有課', 'secondary')] })] };
  const first = blocks.find((b) => b.startAt > ctx.now);
  const titleRight = first && first === blocks[0]
    ? [seg(`第一堂還有 ${T.durationText(Math.ceil((first.startAt - ctx.now) / 60000))}`, 'secondary')]
    : [];
  return {
    id: 'schedule',
    title: '今日課表',
    titleRight,
    rows: blocks.map((b) => classRow(b, { range: true, muted: b.endAt <= ctx.now })),
  };
}

function countdownSection(ctx, n, title = '倒數') {
  const items = listItems(ctx).slice(0, n);
  if (ctx.countdown.error && !items.length) {
    return { id: 'countdown', title, rows: [row({ icon: 'calendar', iconColor: 'gray', left: [seg(ctx.countdown.error, 'gray')], muted: true })] };
  }
  if (!items.length) {
    return ctx.countdown.alerts.length ? null : { id: 'countdown', title, rows: [row({ left: [seg('45 天內沒有考試或截止', 'secondary')] })] };
  }
  return { id: 'countdown', title, rows: items.map((e) => countdownRow(e)) };
}

function nowClassSection(ctx) {
  if (ctx.exams.today) {
    return { id: 'exams', title: examWeekTitle(ctx.exams.today), rows: examListRows(ctx.exams.todayWeek, 3) };
  }
  const st = ctx.status;
  if (st.current) {
    const c = st.current.course;
    const left = st.current.minutesLeft;
    return {
      id: 'now',
      title: '現在',
      titleRight: [seg(`${st.current.start}–${st.current.end}`, 'secondary')],
      rows: [row({
        icon: 'book.fill',
        iconColor: 'blue',
        left: [seg(c.short || c.name, null, true), seg(' · ', 'secondary'), ...roomSegs(c)],
        right: [seg(`還有 ${T.durationText(left)}下課`, left <= 10 ? 'orange' : 'secondary', left <= 10)],
      })],
    };
  }
  if (st.nextToday) return null; // break: the "next class" section says it all
  return { id: 'now', title: '現在', rows: [row({ icon: 'checkmark.circle.fill', iconColor: 'green', left: [seg('今天的課上完了', null, true)] })] };
}

function nextClassSection(ctx) {
  if (ctx.exams.today) return null;
  const n = ctx.status.next;
  if (!n) return null;
  const c = n.course;
  const when = n.rel === '今天' ? n.start : `${n.rel} ${n.start}`;
  const right = n.rel === '今天' ? [seg(when, null, true), seg(`（${T.durationText(n.minutesUntil)}後）`, 'secondary')] : [seg(when, null, true)];
  const rows = [row({ icon: 'book.fill', iconColor: 'secondary', left: [seg(c.short || c.name, null, true), seg(' · ', 'secondary'), ...roomSegs(c)], right })];
  // Bikes near the classroom only matter if the class is today.
  const yb = n.rel === '今天' ? youbikeRow(ctx, F.stationForBuilding(c.building, ctx.courses)) : null;
  if (yb) rows.push(yb);
  const st = ctx.status;
  const titleRight = !st.current && st.nextToday ? [seg(st.inBreak ? '下課空檔' : '還沒上課', 'secondary')] : [];
  return { id: 'next', title: '下一堂', titleRight, rows };
}

function stockMiniSection(ctx) {
  const s = ctx.stocks;
  if (!s.ok || !s.status.todayTraded) return null;
  const r = pinnedRow(ctx);
  if (!r) return null;
  return { id: 'stocks', title: '台股', titleRight: [seg(s.status.label, s.status.open ? 'secondary' : 'gray')], rows: [r] };
}

function stocksSection(ctx, opts = {}) {
  const s = ctx.stocks;
  const title = '台股';
  if (!s.ok) {
    return { id: 'stocks', title, rows: [row({ icon: 'chart.bar.fill', iconColor: 'gray', left: [seg('台股資料暫時抓不到', 'gray')], muted: true })] };
  }
  const weekly = opts.weekly && s.hasWeekly;
  const label = weekly ? `截至 ${T.md(s.status.dateKey)}` : s.status.label;
  const rows = [pinnedRow(ctx, { weekly })].filter(Boolean);
  const themes = weekly ? s.weeklyThemes : s.themes;
  for (const t of themes) rows.push(themeRow(t));
  return { id: 'stocks', title: weekly ? '本週台股' : '台股', titleRight: [seg(label, 'secondary')], rows };
}

function afternoonMiscSection(ctx) {
  const rows = [];
  const w = ctx.weather;
  if (w.ok && w.eveningRain) {
    const u = w.eveningRain;
    rows.push(u.need
      ? row({ icon: 'cloud.rain.fill', iconColor: 'orange', left: [seg('晚上可能下雨', 'orange', true), seg(` · ${W.rangeText(u.range)}（${u.peak.pop}%）`, 'secondary')], muted: w.stale })
      : row({ icon: 'moon.stars.fill', iconColor: 'secondary', left: [seg('晚上不會下雨'), seg(` · 降雨機率最高 ${u.maxPop}%`, 'secondary')], muted: w.stale }));
  } else if (!w.ok) rows.push(weatherMissingRow());
  rows.push(noticesCountRow(ctx));
  return { id: 'misc', title: '', rows: rows.filter(Boolean) };
}

function noticesCountRow(ctx) {
  const n = ctx.notices;
  if (!n.feed) {
    return row({ icon: 'megaphone.fill', iconColor: 'gray', left: [seg(n.missing ? '公告資料還沒建立' : '公告資料暫時抓不到', 'gray')], muted: true });
  }
  const count = n.recent.length;
  return row({
    icon: 'megaphone.fill',
    iconColor: count ? 'blue' : 'secondary',
    left: [seg('過去 24 小時新公告 '), seg(`${count} 則`, null, true)],
    right: n.stale && n.checkedAt ? [seg(`${T.hm(n.checkedAt)} 的資料`, 'gray')] : [],
    muted: n.stale,
  });
}

function week7Section(ctx) {
  const items = listItems(ctx).filter((e) => e.days <= 7);
  if (!items.length) {
    return ctx.countdown.alerts.length ? null : { id: 'week7', title: '7 天內考試／截止', rows: [row({ left: [seg('7 天內沒有考試或截止', 'secondary')] })] };
  }
  return { id: 'week7', title: '7 天內考試／截止', rows: items.slice(0, 3).map((e) => countdownRow(e)) };
}

// Next class from the evening / late-night point of view.
function upcomingFirstSection(ctx, opts = {}) {
  const n = ctx.status.next;
  const rows = [];
  // No timetable during winter break, or when there's no class in the next two weeks.
  if (!n || (ctx.nextInfo && ctx.nextInfo.winterBreak) || T.diffDays(ctx.today, n.dateKey) > 14) return null;
  if (ctx.nextInfo && ctx.nextInfo.exam) {
    const title = ctx.todayInfo.exam || n.rel === '今天' ? examWeekTitle(ctx.nextInfo.exam) : `${n.rel}起${ctx.nextInfo.exam.label}`;
    return { id: 'exams', title, rows: examListRows(ctx.exams.next, opts.big ? 2 : 3) };
  }
  rows.push(classRow(n, { big: opts.big }));
  const title = opts.title || (n.rel === '明天' ? '明天第一堂' : n.rel === '今天' ? '第一堂' : `${n.rel}第一堂`);
  // The title already names the day unless it's today's first class.
  rows[rows.length - 1].right = n.rel === '今天' ? [seg('今天', null, true), seg(' · ', 'secondary'), ...roomSegs(n.course)] : roomSegs(n.course);
  return { id: 'first', title, rows };
}

// Evening: tomorrow's first class (or holiday / exam week) and tomorrow's weather in one card.
function tomorrowSection(ctx) {
  const rows = [];
  let title = '明天';
  const n = ctx.status.next;
  const info = ctx.tomorrowInfo;
  const winter = info.winterBreak || (ctx.nextInfo && ctx.nextInfo.winterBreak);
  if (!info.classDay && info.offLabel && !(info.weekend && !n)) {
    const next = ctx.cfg.semester && ctx.cfg.semester.nextSemesterStart;
    const text = info.winterBreak && !ctx.todayInfo.winterBreak ? `明天開始放寒假${next ? `（${T.md(next)} 開學）` : ''}`
      : info.winterBreak ? null : info.weekend ? '明天是週末' : `明天放假：${info.offLabel}`;
    if (text) rows.push(row({ icon: 'calendar', iconColor: 'secondary', left: [seg(text, 'secondary')] }));
  }
  if (!winter && n && T.diffDays(ctx.today, n.dateKey) <= 14) {
    if (ctx.nextInfo && ctx.nextInfo.exam) {
      title = n.rel === '明天' ? `明天 · ${ctx.nextInfo.exam.label}` : `${n.rel} · ${ctx.nextInfo.exam.label}`;
      rows.push(...examListRows(ctx.exams.next, 2));
    } else {
      const c = n.course;
      rows.push(row({
        icon: 'book.fill',
        iconColor: 'secondary',
        left: [seg(n.rel === '明天' ? '第一堂 ' : `${n.rel} `, 'secondary'), seg(n.start, null, true), seg(` ${c.short || c.name}`, null, true)],
        right: roomSegs(c),
      }));
    }
  }
  const w = ctx.weather;
  const d = w.tomorrow;
  if (!w.ok) rows.push(weatherMissingRow());
  else if (d) {
    const u = w.umbrellaTomorrow;
    rows.push(row({
      icon: d.symbol,
      iconColor: 'secondary',
      left: [seg(`${Math.round(d.min)}°–${Math.round(d.max)}°`, null, true), seg(` ${d.text}`), seg(` · 降雨 ${d.popMax}%`, 'secondary')],
      right: u && u.need ? [seg('要帶傘 ', 'orange', true), seg(W.rangeText(u.range), 'orange')] : [seg('不用帶傘', 'secondary')],
      muted: w.stale,
    }));
  }
  return rows.length ? { id: 'tomorrow', title, rows } : null;
}

function noticesTitlesSection(ctx) {
  const n = ctx.notices;
  if (!n.feed) return { id: 'notices', title: '公告', rows: [noticesCountRow(ctx)] };
  const recent = n.recent;
  if (!recent.length) return { id: 'notices', title: '今天新公告', rows: [row({ icon: 'megaphone', iconColor: 'secondary', left: [seg('過去 24 小時沒有新公告', 'secondary')], muted: n.stale })] };
  return {
    id: 'notices',
    title: '今天新公告',
    titleRight: [seg(`${recent.length} 則`, 'secondary')],
    rows: recent.slice(0, 2).map((item) => row({
      left: [seg(item.group || '公告', 'blue'), seg(` ${item.title}`)],
      url: item.url,
      muted: n.stale,
    })),
  };
}

function macroSection(ctx) {
  const m = ctx.macro;
  if (m.tonight.length) {
    return {
      id: 'macro',
      title: '今晚美股大事',
      rows: m.tonight.slice(0, 2).map((e) => row({
        icon: 'chart.bar.fill',
        iconColor: 'orange',
        left: [seg(e.title), seg(e.confirmed === false ? '（預估）' : '', 'secondary')],
        right: [seg(M.nightLabel(e.time, ctx.now), 'orange', true)],
      })),
    };
  }
  if (!m.next) return null;
  return { id: 'macro', title: '', rows: [macroNextRow(ctx, m.next)] };
}

function macroNextRow(ctx, e) {
  const days = M.daysUntil(e.time, ctx.now);
  return row({
    icon: 'chart.bar.fill',
    iconColor: 'secondary',
    left: [seg(e.title), seg(` ${M.whenText(e.time)}`, 'secondary'), seg(e.confirmed === false ? ' 預估' : '', 'gray')],
    right: [seg(days <= 1 ? (days === 0 ? '今天' : '明天') : `還有 ${days} 天`, 'secondary')],
  });
}

function nearestExamSection(ctx, big) {
  const e = ctx.countdown.items.find((x) => x.kind === 'exam');
  if (e && ctx.countdown.alerts.includes(e)) return null; // already in the red alert
  if (!e) return { id: 'exam', title: '最近的考試', rows: [row({ left: [seg('45 天內沒有考試', 'secondary')], big })] };
  const r = countdownRow(e);
  r.big = !!big;
  return { id: 'exam', title: '最近的考試', rows: [r] };
}

function classdayMiscSection(ctx) {
  const rows = [];
  const s = ctx.weather.sun;
  if (s && T.at(ctx.today, s.end) > ctx.now) rows.push(sunRow(ctx));
  if (ctx.weather.ok && ctx.weather.umbrellaToday && ctx.weather.umbrellaToday.need) rows.push(umbrellaRow(ctx.weather.umbrellaToday, ctx.weather.stale));
  if (!rows.length) return null;
  return { id: 'misc', title: '', rows };
}

// ---------------------------------------------------------------- modes

const MODE_SECTIONS = {
  morning: [alertSection, weatherTodaySection, scheduleTodaySection, (ctx) => countdownSection(ctx, 3)],
  classday: [alertSection, nowClassSection, nextClassSection, stockMiniSection, classdayMiscSection, (ctx) => countdownSection(ctx, 2)],
  afternoon: [alertSection, stocksSection, (ctx) => countdownSection(ctx, 3), afternoonMiscSection],
  evening: [alertSection, week7Section, tomorrowSection, noticesTitlesSection, macroSection],
  latenight: [alertSection, (ctx) => upcomingFirstSection(ctx, { big: true }), (ctx) => nearestExamSection(ctx, true)],
  holiday: [alertSection, (ctx) => countdownSection(ctx, 3), weatherTodaySection, (ctx) => upcomingFirstSection(ctx), (ctx) => stocksSection(ctx, { weekly: true })],
};

// ---------------------------------------------------------------- small widget ("glance")

function glanceItems(ctx) {
  const items = [];
  const add = (x) => { if (x) items.push(x); };
  const a = ctx.countdown.alerts[0];
  if (a) add({ icon: 'exclamationmark.triangle.fill', color: 'red', title: a.label, detail: a.display });
  const nextClass = (prefix) => {
    const n = ctx.status.next;
    if (!n || T.diffDays(ctx.today, n.dateKey) > 14 || (ctx.nextInfo && ctx.nextInfo.winterBreak)) return null;
    if (ctx.nextInfo && ctx.nextInfo.exam) {
      const e = (ctx.exams.next || []).find((x) => x !== a);
      return e
        ? { icon: 'pencil.circle.fill', color: e.color, title: `${T.md(e.startKey)} ${e.label}`, detail: e.display }
        : { icon: 'pencil.circle.fill', title: ctx.nextInfo.exam.label, detail: '行事曆裡沒有這週的考試' };
    }
    const rel = n.rel === '今天' ? '' : `${n.rel} `;
    return { icon: 'book.fill', title: `${prefix || rel}${n.start} ${n.course.short || n.course.name}`, detail: n.course.room };
  };
  const topCountdown = () => {
    const e = ctx.countdown.items.find((x) => x !== a);
    return e ? { icon: e.kind === 'exam' ? 'pencil.circle.fill' : 'clock.fill', color: e.color, title: e.label, detail: e.display } : null;
  };
  const umbrella = (u, word) => (u ? { icon: u.need ? 'umbrella.fill' : 'umbrella', color: u.need ? 'orange' : null, title: `${word || ''}${u.need ? '要帶傘' : '不用帶傘'}`, detail: u.need ? W.rangeText(u.range) : `降雨 ${u.maxPop}%` } : null);
  const stocks = () => {
    const s = ctx.stocks;
    const q = s.pinned[0];
    if (!q) return null;
    return { icon: 'chart.bar.fill', color: K.trendColor(q.changePct), title: `${q.name} ${K.formatPct(q.changePct)}`, detail: s.index ? `加權 ${K.formatPct(s.index.changePct)}` : s.status.label };
  };
  const st = ctx.status;
  switch (ctx.mode.mode) {
    case 'morning':
      add(nextClass('第一堂 '));
      add(umbrella(ctx.weather.umbrellaToday));
      add(topCountdown());
      break;
    case 'classday':
      if (st.current) add({ icon: 'book.fill', color: 'blue', title: `${st.current.course.short} 剩 ${st.current.minutesLeft} 分`, detail: st.current.course.room });
      add(nextClass());
      add(topCountdown());
      break;
    case 'afternoon':
      add(stocks());
      add(topCountdown());
      add(umbrella(ctx.weather.eveningRain, '晚上'));
      break;
    case 'evening':
      add(nextClass());
      add(topCountdown());
      add(umbrella(ctx.weather.umbrellaTomorrow, '明天'));
      break;
    case 'latenight':
      add(nextClass());
      add(topCountdown());
      break;
    default:
      add(topCountdown());
      add(ctx.weather.current ? { icon: ctx.weather.current.symbol, title: `${Math.round(ctx.weather.current.temp)}° ${ctx.weather.current.text}`, detail: ctx.weather.today ? `${Math.round(ctx.weather.today.min)}°–${Math.round(ctx.weather.today.max)}°` : '' } : null);
      add(nextClass());
  }
  return items.slice(0, FAMILY.small.glanceItems);
}

// ---------------------------------------------------------------- fitting & assembly

function rowCost(r) {
  return r.big ? 1.5 : 1;
}

function fitSections(sections, family) {
  const f = FAMILY[family] || FAMILY.large;
  const out = [];
  let used = 0;
  for (const s of sections) {
    if (!s || !s.rows || !s.rows.length) continue;
    if (out.length >= f.maxSections) break;
    const head = (s.title && f.titles ? f.headerCost : 0) + f.sectionCost;
    let cost = 0;
    let n = 0;
    for (const r of s.rows.slice(0, f.maxRows || s.rows.length)) {
      if (used + head + cost + rowCost(r) > f.maxUnits + 1e-9) break;
      cost += rowCost(r);
      n++;
    }
    if (!n) continue;
    out.push({ ...s, rows: s.rows.slice(0, n), truncated: n < s.rows.length });
    used += head + cost;
  }
  return out;
}

function safeSections(ctx, builders) {
  return builders.map((b) => {
    try {
      return b(ctx);
    } catch (e) {
      return { id: 'error', title: '', rows: [row({ icon: 'exclamationmark.circle', iconColor: 'gray', left: [seg(`這區暫時無法顯示：${e.message}`, 'gray')], muted: true })] };
    }
  });
}

function buildLayout(ctx, family = 'large') {
  const fam = FAMILY[family] ? family : 'small';
  const modeKey = ctx.mode.mode;
  const subtitleParts = [T.mdw(ctx.today)];
  if (ctx.todayInfo.exam) subtitleParts.push(ctx.todayInfo.exam.label);
  if (modeKey === 'holiday' && ctx.todayInfo.offLabel) subtitleParts.push(ctx.todayInfo.offLabel);
  const cur = ctx.weather.current;
  const layout = {
    family: fam,
    mode: modeKey,
    title: ctx.mode.title,
    symbol: ctx.mode.symbol,
    subtitle: subtitleParts.join(' · '),
    headerRight: cur && cur.temp != null ? { icon: cur.symbol, text: `${Math.round(cur.temp)}°`, muted: ctx.weather.stale } : null,
    showTitles: !!(FAMILY[fam] && FAMILY[fam].titles),
    sections: [],
    glance: [],
    footer: footerFor(ctx),
    refreshAt: refreshAt(ctx),
  };
  if (fam === 'small') {
    try {
      layout.glance = glanceItems(ctx);
    } catch (e) {
      layout.glance = [{ icon: 'exclamationmark.circle', title: '暫時無法顯示', detail: e.message }];
    }
    return layout;
  }
  layout.sections = fitSections(safeSections(ctx, MODE_SECTIONS[modeKey]), fam);
  return layout;
}

function footerFor(ctx) {
  const parts = [seg(`更新 ${T.hm(ctx.now)}`, 'tertiary')];
  if (ctx.weather.wx && ctx.weather.stale && ctx.weather.fetchedAt) parts.unshift(seg(`天氣 ${T.hm(ctx.weather.fetchedAt)} · `, 'gray'));
  return { right: parts };
}

function refreshAt(ctx) {
  const soon = new Date(ctx.now.getTime() + 15 * 60000);
  const boundary = nextBoundary(ctx.now, ctx.courses, ctx.cfg.semester || {});
  const t = boundary < soon ? boundary : soon;
  return new Date(Math.max(t.getTime(), ctx.now.getTime() + 60000));
}

module.exports = {
  FAMILY,
  MODE_SECTIONS,
  buildLayout,
  fitSections,
  glanceItems,
  seg,
  row,
};
