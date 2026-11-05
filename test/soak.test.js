'use strict';
// Soak test: every day from September to March at many times of day, every widget size, with
// data randomly missing, stale or malformed. Each layout is also drawn with the strict fake
// Scriptable API, so a crash anywhere in the pipeline fails the test.
const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../src/lib/time');
const S = require('../src/dev/scenario');
const { makeForecast } = require('../src/dev/weather-gen');
const { createScriptableEnv, widgetTexts } = require('../src/dev/fake-scriptable');
const { buildContext } = require('../src/widget/context');
const { buildLayout, FAMILY } = require('../src/widget/layout');
const { renderWidget } = require('../src/widget/render-widget');
const { renderText } = require('../src/widget/render-text');

const FAMILIES = ['large', 'medium', 'small', 'accessoryRectangular', 'accessoryCircular', 'accessoryInline'];
const SLOTS = ['00:00', '01:30', '05:59', '06:00', '07:40', '09:09', '09:10', '10:35', '11:59', '12:00', '12:30', '13:29', '13:30',
  '14:45', '15:59', '16:00', '17:20', '17:59', '18:00', '20:00', '21:30', '23:59'];

function units(layout) {
  const f = FAMILY[layout.family];
  const cost = (r) => (r.kind === 'progress' ? 0.4 : r.kind === 'bars' ? 1.4 : r.big ? 1.5 : 1);
  return layout.sections.reduce((u, s) => u + (s.title && f.titles ? f.headerCost : 0) + f.sectionCost + s.rows.reduce((a, r) => a + cost(r), 0), 0);
}

// Deterministic pseudo-random so failures reproduce.
function rng(seed) {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return ((x >>> 0) % 1000) / 1000;
  };
}

test('every day × time × size renders without errors, within the space budget', () => {
  const cfgAll = S.loadConfigs();
  const cfg = { courses: cfgAll.courses, semester: cfgAll.semester, location: cfgAll.location, watchlist: cfgAll.watchlist, macro: cfgAll.macro, youbike: cfgAll.youbike };
  const base = T.parseTime('2026-10-22T07:30');
  const notices = S.noticesFeed(base, cfgAll.notices);
  const youbike = S.youbikeFeed(base, cfgAll.youbike, 0);
  const activities = S.activitiesFeed(base, cfgAll);
  const stocks = S.twseResponse(base, cfgAll.watchlist, { keepDate: true });
  const events = S.calendarEvents();
  const env = createScriptableEnv({ runsInWidget: true });
  const sc = env.globals;
  const rand = rng(20261105);
  let count = 0;
  const modes = new Set();
  for (let key = '2026-09-01'; key <= '2027-03-01'; key = T.addDays(key, 1)) {
    const rain = rand() < 0.4 ? { [key]: { from: 6 + Math.floor(rand() * 12), to: 20, pop: 60 + Math.floor(rand() * 40), mm: rand() * 3 } } : {};
    const forecast = makeForecast(key, { rain, uvPeak: 4 + Math.floor(rand() * 8) });
    for (const slot of SLOTS) {
      const now = T.at(key, slot);
      const pick = () => rand();
      const data = {
        calendar: pick() < 0.05 ? { events: [], error: '讀不到行事曆（請在 App 裡執行一次並允許取用行事曆）' } : { events },
        weather: pick() < 0.1 ? { json: null, error: 'offline' } : { json: forecast, fetchedAt: new Date(now - (pick() < 0.1 ? 5 * 3600e3 : 600e3)).toISOString() },
        stocks: pick() < 0.1 ? { json: null, error: 'HTTP 500' } : { json: stocks, fetchedAt: new Date(now - 60e3).toISOString() },
        notices: pick() < 0.1 ? { json: null, missing: true } : { json: notices, fetchedAt: now.toISOString() },
        youbike: pick() < 0.1 ? { json: null, error: 'offline' } : { json: youbike, fetchedAt: now.toISOString() },
        activities: pick() < 0.2 ? { json: null, missing: true } : { json: activities },
        courseState: null,
        stockHistory: null,
      };
      const ctx = buildContext(now, cfg, data);
      modes.add(ctx.mode.mode);
      for (const family of FAMILIES) {
        const layout = buildLayout(ctx, family);
        const where = `${key} ${slot} ${family}`;
        const text = renderText(layout);
        assert.ok(!text.includes('暫時無法顯示'), `${where}\n${text}`);
        assert.ok(!/undefined|NaN|null|\[object/.test(text), `${where}\n${text}`);
        if (FAMILY[family] && family !== 'small') assert.ok(units(layout) <= FAMILY[family].maxUnits + 1e-9, `${where} too tall`);
        const w = renderWidget(layout, sc);
        assert.ok(widgetTexts(w).length > 0, where);
        count++;
      }
    }
  }
  assert.deepEqual([...modes].sort(), ['afternoon', 'classday', 'evening', 'holiday', 'latenight', 'morning']);
  assert.ok(count > 20000);
});

test('malformed feeds never crash the widget', () => {
  const cfgAll = S.loadConfigs();
  const cfg = { courses: cfgAll.courses, semester: cfgAll.semester, location: cfgAll.location, watchlist: cfgAll.watchlist, macro: cfgAll.macro, youbike: cfgAll.youbike };
  const env = createScriptableEnv({ runsInWidget: true });
  const garbage = [
    {},
    { hourly: {} },
    { hourly: { time: ['x', null, '2026-10-22T08:00'], temperature_2m: [null, 'a'], precipitation_probability: [] }, current: { temperature_2m: null } },
    { msgArray: [{}, { c: '2330' }, { c: '2330', z: 'abc', y: '0' }, { c: 't00', z: '-', y: '-', b: '', a: '' }] },
    { items: [{}, { id: 'x' }, { id: 'y', firstSeen: 'not a date', title: null }, null] },
    { stations: [{}, { no: '501209051', bikes: null }, { no: '501209070', bikes: 'many', docks: -1 }] },
    { events: [{}, { date: '2026-10-23', start: 'noon' }, { date: '2026-10-23', start: '12:10', avail: 'x', openAt: 'bad' }], types: null },
    [],
    'not json at all',
  ];
  const now = T.parseTime('2026-10-23T12:20');
  for (const g of garbage) {
    for (const family of FAMILIES) {
      const data = {
        calendar: { events: [{ title: '考試', start: 'bad' }, { title: null }, { title: '期末考', start: '2026-10-24', end: null, allDay: true }] },
        weather: { json: g, fetchedAt: 'garbage' },
        stocks: { json: g, fetchedAt: now.toISOString() },
        notices: { json: g },
        youbike: { json: g },
        activities: { json: g },
        courseState: { json: g },
        stockHistory: g,
      };
      const ctx = buildContext(now, cfg, data);
      const layout = buildLayout(ctx, family);
      renderWidget(layout, env.globals);
      assert.ok(!/undefined|NaN|\[object/.test(renderText(layout)), `${JSON.stringify(g).slice(0, 60)} ${family}\n${renderText(layout)}`);
    }
  }
});
