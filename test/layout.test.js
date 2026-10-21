'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { scenarioAdapter } = require('../src/dev/scenario');
const { loadConfig, loadWidgetData } = require('../src/widget/data');
const { buildContext } = require('../src/widget/context');
const { buildLayout, FAMILY } = require('../src/widget/layout');
const { renderText } = require('../src/widget/render-text');
const { tp } = require('./helpers');

async function ctxAt(s, opts) {
  const now = tp(s);
  const a = scenarioAdapter(now, opts);
  const cfg = await loadConfig(a);
  return buildContext(now, cfg, await loadWidgetData(a, cfg));
}

const texts = (layout) => layout.sections.flatMap((s) => [s.title, ...s.rows.flatMap((r) => [...r.left, ...r.right].map((x) => x.t))]).join(' ');
const ids = (layout) => layout.sections.map((s) => s.id);

function units(layout) {
  const f = FAMILY[layout.family];
  return layout.sections.reduce((u, s) => u + (s.title && f.titles ? f.headerCost : 0) + f.sectionCost + s.rows.reduce((a, r) => a + (r.big ? 1.5 : 1), 0), 0);
}

test('every mode renders in every size without errors and within budget', async () => {
  const times = ['2026-10-22 07:30', '2026-10-23 12:20', '2026-10-21 15:00', '2026-10-21 20:30', '2026-10-22 01:10', '2026-10-24 10:00'];
  const modes = new Set();
  for (const t of times) {
    const ctx = await ctxAt(t);
    modes.add(ctx.mode.mode);
    for (const fam of ['large', 'medium', 'small']) {
      const l = buildLayout(ctx, fam);
      assert.ok(!texts(l).includes('暫時無法顯示'), `${t} ${fam}`);
      if (fam === 'small') assert.ok(l.glance.length >= 2 && l.glance.length <= 3, `${t} small`);
      else {
        assert.ok(l.sections.length > 0);
        assert.ok(units(l) <= FAMILY[fam].maxUnits + 1e-9, `${t} ${fam} too tall`);
      }
      assert.ok(renderText(l).length > 0);
    }
  }
  assert.deepEqual([...modes].sort(), ['afternoon', 'classday', 'evening', 'holiday', 'latenight', 'morning']);
});

test('an exam within 48 hours is pinned on top, in red, in any mode', async () => {
  for (const t of ['2026-10-22 07:30', '2026-10-23 12:20', '2026-10-23 20:00', '2026-10-24 02:00', '2026-10-24 10:00']) {
    const l = buildLayout(await ctxAt(t), 'large');
    assert.equal(l.sections[0].id, 'alert', t);
    assert.equal(l.sections[0].tone, 'alert');
    assert.equal(l.sections[0].rows[0].left[0].c, 'red');
    assert.equal(buildLayout(await ctxAt(t), 'small').glance[0].color, 'red');
  }
  // …and is not repeated in the countdown list right below it
  const morning = buildLayout(await ctxAt('2026-10-22 07:30'), 'large');
  const countdown = morning.sections.find((s) => s.id === 'countdown');
  assert.ok(!countdown.rows.some((r) => r.left[0].t.includes('BESTEP')));
});

test('morning: weather with umbrella, today\'s classes with first-class countdown, 3 countdowns', async () => {
  const l = buildLayout(await ctxAt('2026-10-22 07:30'), 'large');
  assert.deepEqual(ids(l), ['alert', 'weather', 'schedule', 'countdown']);
  assert.match(texts(l), /要帶傘/);
  assert.equal(l.sections[2].titleRight[0].t, '第一堂還有 1 小時 40 分');
  assert.match(texts(l), /09:10–12:00\s+C\+\+/);
});

test('class day: current class with minutes left, next class with YouBike, compact stock row', async () => {
  const l = buildLayout(await ctxAt('2026-10-26 10:30'), 'large');
  assert.deepEqual(ids(l).slice(0, 3), ['now', 'next', 'stocks']);
  assert.match(texts(l), /數位設計/);
  assert.match(texts(l), /還有 1 小時 30 分下課/);
  assert.match(texts(l), /英語化學/);
  assert.match(texts(l), /西灣藝廊 .*可借/);
  assert.match(texts(l), /台積電.*加權/);
});

test('during the midterm week the timetable becomes "本週考試"', async () => {
  const l = buildLayout(await ctxAt('2026-10-29 10:00'), 'large');
  const s = l.sections.find((x) => x.id === 'exams');
  assert.equal(s.title, '本週考試（期中考週）');
  assert.match(s.rows[0].left.map((x) => x.t).join(''), /普通物理/);
  assert.ok(!ids(l).includes('now'));
  const morning = buildLayout(await ctxAt('2026-10-28 07:00'), 'large');
  assert.ok(morning.sections.some((x) => x.title === '本週考試（期中考週）'));
  assert.equal(morning.subtitle, '10/28（三） · 期中考週');
});

test('holidays and winter break show no timetable', async () => {
  const hol = buildLayout(await ctxAt('2026-10-09 10:00'), 'large');
  assert.equal(hol.mode, 'holiday');
  assert.match(hol.subtitle, /國慶紀念日補假/);
  assert.ok(!ids(hol).includes('schedule'));
  const winter = buildLayout(await ctxAt('2027-01-10 11:00'), 'large');
  assert.ok(!ids(winter).includes('first'));
  const winterEvening = buildLayout(await ctxAt('2027-01-10 20:00'), 'large');
  assert.ok(!/第一堂/.test(texts(winterEvening)));
});

test('evening: tomorrow\'s first class, tomorrow\'s weather, today\'s notices, tonight\'s US event', async () => {
  const l = buildLayout(await ctxAt('2026-10-28 20:30'), 'large');
  assert.match(texts(l), /今晚美股大事\s+聯準會利率決議\s+凌晨 2:00/);
  assert.match(texts(l), /今天新公告/);
  const fri = buildLayout(await ctxAt('2026-10-23 20:30'), 'large');
  assert.match(texts(fri), /明天是週末/);
  assert.match(texts(fri), /下週一\s+09:10\s+數位設計/);
});

test('stale YouBike data is grey and shows its time; missing Pages data says so', async () => {
  const ctx = await ctxAt('2026-10-26 12:20', { youbikeAge: 45 });
  const l = buildLayout(ctx, 'large');
  const yb = l.sections.find((s) => s.id === 'next').rows.find((r) => r.icon === 'bicycle');
  assert.equal(yb.muted, true);
  assert.equal(yb.right[0].t, '11:35 的資料');
  const first = buildLayout(await ctxAt('2026-10-21 15:00', { notices: false, weather: false }), 'large');
  assert.match(texts(first), /公告資料還沒建立/);
  assert.match(texts(first), /天氣暫時抓不到/);
});

test('calendar permission missing is explained in the countdown card', async () => {
  const l = buildLayout(await ctxAt('2026-10-22 07:30', { calendar: 'deny' }), 'large');
  assert.match(texts(l), /讀不到行事曆/);
});
