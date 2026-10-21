'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const W = require('../src/widget/weather');
const T = require('../src/lib/time');
const { makeForecast } = require('../src/dev/weather-gen');
const { readJson, tp } = require('./helpers');

const wx = (key, opts) => W.parseForecast(makeForecast(key, opts));

test('parses the Open-Meteo response shape (fixture)', () => {
  const p = W.parseForecast(readJson('test/fixtures/open-meteo-2026-10-22.json'));
  assert.equal(p.hours.length, 48);
  assert.equal(p.hours[0].key, '2026-10-22');
  assert.equal(p.hours[0].hour, 0);
  assert.equal(p.days.length, 2);
  assert.ok(p.current.temp > 0);
  assert.equal(W.parseForecast({ error: true, reason: 'Too many requests' }), null);
  assert.equal(W.parseForecast(null), null);
});

test('umbrella: any hour until 20:00 with ≥ 50% or ≥ 0.5 mm', () => {
  const rainy = wx('2026-10-22', { rain: { '2026-10-22': { from: 15, to: 17, pop: 70, mm: 1.2 } } });
  const u = W.umbrellaToday(rainy, tp('2026-10-22 07:30'));
  assert.equal(u.need, true);
  assert.equal(W.rangeText(u.range), '15:00–18:00');
  assert.equal(u.peak.pop, 70);

  const drizzle = wx('2026-10-22', { rain: { '2026-10-22': { from: 12, to: 12, pop: 30, mm: 0.6 } } });
  assert.equal(W.umbrellaToday(drizzle, tp('2026-10-22 07:30')).need, true); // mm alone is enough

  const late = wx('2026-10-22', { rain: { '2026-10-22': { from: 21, to: 22, pop: 90, mm: 3 } } });
  assert.equal(W.umbrellaToday(late, tp('2026-10-22 07:30')).need, false); // after 20:00 doesn't count

  const passed = W.umbrellaToday(rainy, tp('2026-10-22 18:30'));
  assert.equal(passed.need, false); // the rain is over
});

test('Open-Meteo unavailable → no umbrella answer and no notification change', () => {
  assert.equal(W.umbrellaToday(null, tp('2026-10-22 07:30')), null);
  assert.equal(W.notificationPlan(null, tp('2026-10-22 07:30')), null);
  assert.equal(W.sunWindow(null, '2026-10-22', [], tp('2026-10-22 07:30')), null);
});

test('reminder for the next 07:30: schedule when rain, cancel when dry', () => {
  const rainTomorrow = wx('2026-10-22', { rain: { '2026-10-23': { from: 8, to: 9, pop: 80, mm: 2 } } });
  const plan = W.notificationPlan(rainTomorrow, tp('2026-10-22 21:00'));
  assert.equal(plan.action, 'schedule');
  assert.equal(plan.id, 'nsysu-hud-umbrella');
  assert.equal(plan.at.toISOString(), tp('2026-10-23 07:30').toISOString());
  assert.match(plan.body, /08:00–10:00/);
  // Before 07:30 the next reminder is today's.
  const rainToday = wx('2026-10-22', { rain: { '2026-10-22': { from: 16, to: 16, pop: 60, mm: 0.2 } } });
  assert.equal(W.notificationPlan(rainToday, tp('2026-10-22 01:00')).at.toISOString(), tp('2026-10-22 07:30').toISOString());
  const dry = wx('2026-10-22', { rain: {} });
  assert.deepEqual(W.notificationPlan(dry, tp('2026-10-22 21:00')), { action: 'cancel', id: 'nsysu-hud-umbrella' });
});

test('sunshine window prefers free time with UV 3–7', () => {
  // Mild day, UV peak 7: Monday has classes 09:10–12:00 and 13:10–16:00 → lunch gap 12:00–13:10
  const mild = wx('2026-10-26', { uvPeak: 7, rain: {} });
  const blocks = [{ startMin: 550, endMin: 720 }, { startMin: 790, endMin: 960 }];
  const s = W.sunWindow(mild, '2026-10-26', blocks, tp('2026-10-26 07:00'));
  assert.equal(s.kind, 'good');
  assert.equal(s.text, '曬太陽好時段 12:10–12:40（UV 7）');
  // Holiday: whole morning free → the strongest hour still within 3–7
  const h = W.sunWindow(mild, '2026-10-26', [], tp('2026-10-26 07:00'));
  assert.equal(h.kind, 'good');
  assert.ok(h.uv <= 7 && h.uv >= 3);
});

test('sunshine window: UV ≥ 8 in the free time → "10 分鐘就夠"', () => {
  const strong = wx('2026-10-26', { uvPeak: 11, rain: {} });
  const blocks = [{ startMin: 550, endMin: 720 }, { startMin: 790, endMin: 960 }];
  const s = W.sunWindow(strong, '2026-10-26', blocks, tp('2026-10-26 07:00'));
  assert.equal(s.kind, 'strong');
  assert.match(s.text, /^UV 很強（\d+），10 分鐘就夠 12:10–12:20$/);
  // windows already over are not suggested; one in progress starts now
  const now = W.sunWindow(strong, '2026-10-26', blocks, tp('2026-10-26 12:25'));
  assert.equal(T.minutesToHm(now.start), '12:25');
  assert.equal(W.sunWindow(strong, '2026-10-26', blocks, tp('2026-10-26 16:00')), null);
});

test('describeCode maps WMO codes to Chinese and SF Symbols', () => {
  assert.deepEqual(W.describeCode(0, true), { text: '晴', symbol: 'sun.max.fill' });
  assert.equal(W.describeCode(63).text, '下雨');
  assert.equal(W.describeCode(95).symbol, 'cloud.bolt.rain.fill');
});
