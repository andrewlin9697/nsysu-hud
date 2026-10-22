'use strict';
// Runs the real single-file bundle in an isolated sandbox with strict fake Scriptable APIs.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { bundle } = require('../scripts/bundle');
const { runBundle } = require('../src/dev/run-bundle');
const { widgetTexts } = require('../src/dev/fake-scriptable');
const { scenarioAdapter, calendarEvents } = require('../src/dev/scenario');
const { ROOT, tp } = require('./helpers');

const { code } = bundle({ entry: path.join(ROOT, 'src/widget/main.js'), root: ROOT, version: 'test' });

function net(now, opts) {
  const a = scenarioAdapter(now, opts);
  return (url) => a.fetch(url);
}

test('dist/NSYSU-HUD.js is up to date with src/ (run `npm run build`)', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const fresh = bundle({ entry: path.join(ROOT, 'src/widget/main.js'), root: ROOT, version: pkg.version }).code;
  assert.equal(fs.readFileSync(path.join(ROOT, 'dist/NSYSU-HUD.js'), 'utf8'), fresh);
});

test('the bundle only depends on Scriptable APIs (no Node modules)', () => {
  assert.ok(!/require\((['"])(fs|path|vm|http|https|url|crypto)\1\)/.test(code));
  assert.ok(code.includes('NSYSU-HUD'));
});

for (const family of ['large', 'medium', 'small']) {
  test(`widget renders (${family})`, async () => {
    const now = tp('2026-10-23 12:20');
    const r = await runBundle({ code, now, runsInWidget: true, family, events: calendarEvents(), fetch: net(now) });
    assert.equal(r.result.mode, 'classday');
    assert.equal(r.record.completed, true);
    const t = widgetTexts(r.record.widget);
    assert.ok(t.includes('上課日'));
    assert.ok(t.some((x) => x.includes('BESTEP')));
    assert.ok(t.some((x) => x.startsWith('更新 12:20')));
    assert.ok(r.record.widget.refreshAfterDate);
  });
}

test('lock-screen and unknown widget families fall back to the small layout', async () => {
  const now = tp('2026-10-22 07:30');
  const r = await runBundle({ code, now, runsInWidget: true, family: 'accessoryRectangular', events: calendarEvents(), fetch: net(now) });
  assert.equal(r.result.family, 'small');
});

test('schedules the 07:30 umbrella reminder with a fixed identifier, or cancels it', async () => {
  const now = tp('2026-10-22 21:00');
  const rain = { weather: { rain: { '2026-10-23': { from: 8, to: 9, pop: 80, mm: 2 } } } };
  const r = await runBundle({ code, now, runsInWidget: true, family: 'large', events: [], fetch: net(now, rain) });
  assert.equal(r.record.scheduled.length, 1);
  assert.equal(r.record.scheduled[0].id, 'nsysu-hud-umbrella');
  assert.equal(r.record.scheduled[0].at.toISOString(), tp('2026-10-23 07:30').toISOString());
  const dry = await runBundle({ code, now, runsInWidget: true, family: 'large', events: [], fetch: net(now, { weather: { rain: {} } }) });
  assert.deepEqual(dry.record.removed, ['nsysu-hud-umbrella']);
  const off = await runBundle({ code, now, runsInWidget: true, family: 'large', events: [], fetch: net(now, { weather: false }) });
  assert.equal(off.record.scheduled.length + off.record.removed.length, 0); // no forecast → leave it alone
});

test('completely offline with no cache still renders a widget', async () => {
  const now = tp('2026-10-22 07:30');
  const r = await runBundle({ code, now, runsInWidget: true, family: 'large', events: calendarEvents(), fetch: async () => { throw new Error('offline'); } });
  assert.equal(r.result.mode, 'morning');
  const t = widgetTexts(r.record.widget);
  assert.ok(t.some((x) => x.includes('天氣暫時抓不到')));
  assert.ok(t.some((x) => x.includes('C++'))); // built-in config copy
});

test('in the app: dashboard tabs, notices open in Safari, live YouBike', async () => {
  const now = tp('2026-10-22 10:35');
  const r = await runBundle({ code, now, runsInWidget: false, events: calendarEvents(), fetch: net(now) });
  assert.equal(r.result.family, 'app');
  assert.equal(r.record.presented.fullscreen, true);
  const table = r.record.table;
  const tabsRow = table.rows[1];
  const labels = tabsRow.cells.map((c) => c.title);
  assert.deepEqual(labels, ['倒數', '課表', '台股', '單車', '公告', '天氣']);
  const cellTitles = () => table.rows.flatMap((row) => row.cells.map((c) => c.title || ''));
  for (const [i, expect] of [[1, /09:10–12:00/], [2, /台積電/], [5, /逐時預報/], [0, /考試：BESTEP/]]) {
    table.rows[1].cells[i].onTap();
    assert.ok(cellTitles().some((t) => expect.test(t)), labels[i]);
  }
  table.rows[1].cells[4].onTap();
  const notice = table.rows.find((row) => row.onSelect && row.cells[0].title.includes('誠徵'));
  notice.onSelect();
  assert.deepEqual(r.record.opened, ['https://web.ee.nsysu.edu.tw/p/406-1203-383728,r2042.php']);
  table.rows[1].cells[3].onTap();
  await new Promise((res) => setImmediate(res));
  await new Promise((res) => setImmediate(res));
  assert.ok(r.record.requests.some((u) => u.includes('station-yb2.json')));
});

test('a crash inside the widget shows an error widget instead of nothing', async () => {
  const now = tp('2026-10-22 07:30');
  const r = await runBundle({ code, now, runsInWidget: true, family: 'large', events: [], fetch: net(now), runOpts: { adapter: { now: () => { throw new Error('boom'); } } } });
  assert.ok(r.result.error);
  assert.ok(widgetTexts(r.record.widget).includes('NSYSU HUD 暫時出錯'));
});
