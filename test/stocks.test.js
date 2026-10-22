'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const K = require('../src/widget/stocks');
const { tp, readJson, configs } = require('./helpers');

const fixture = readJson('fixtures/twse-mis.json');
const { watchlist } = configs();

test('one request carries every symbol (tse_/otc_ prefixes, index included)', () => {
  const url = K.misUrl(watchlist, 123);
  assert.ok(url.startsWith('https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch='));
  const ch = decodeURIComponent(url.split('ex_ch=')[1].split('&')[0]).split('|');
  assert.equal(ch.length, 1 + 3 + 4 + 3 + 6 + 2 + 1);
  assert.ok(ch.includes('tse_2330.tw'));
  assert.ok(ch.includes('otc_4768.tw'));
  assert.ok(ch.includes('tse_t00.tw'));
  assert.match(url, /&json=1&delay=0&_=123$/);
});

test('parses the TWSE MIS fixture', () => {
  const q = K.parseMis(fixture);
  assert.equal(q['2330'].price, 2420);
  assert.equal(q['2330'].prev, 2405);
  assert.equal(q['2330'].priceSource, 'trade');
  assert.equal(q['2330'].changePct.toFixed(2), '0.62');
  assert.equal(q['2330'].dateKey, '2026-10-21');
  assert.equal(q['4768'].changePct.toFixed(2), '-1.73');
  assert.equal(q.t00.price, 46887.77);
  assert.equal(q['2330'].volume, 22224);
});

test('z = "-" falls back to best bid, then ask, then yesterday\'s close', () => {
  const row = { ...fixture.msgArray[0], z: '-' };
  assert.equal(K.parseQuote(row).price, 2415);
  assert.equal(K.parseQuote(row).priceSource, 'bid');
  assert.equal(K.parseQuote({ ...row, b: '-' }).priceSource, 'ask');
  assert.equal(K.parseQuote({ ...row, b: '-', a: '' }).price, 2405);
  assert.equal(K.parseQuote({ ...row, b: '-', a: '' }).changePct, 0);
  assert.equal(K.parseQuote({ ...fixture.msgArray[2], z: '-' }).priceSource, 'prev'); // index has no b/a
});

test('theme summary: average, biggest gainer and loser (no signals)', () => {
  const quotes = {
    3037: { code: '3037', changePct: 3.2 },
    8046: { code: '8046', changePct: -1.1 },
    3189: { code: '3189', changePct: 0.5 },
  };
  const s = K.themeSummary(watchlist.themes[0], quotes);
  assert.equal(s.name, 'ABF 載板');
  assert.equal(s.avg.toFixed(2), '0.87');
  assert.equal(s.top.name, '欣興');
  assert.equal(s.bottom.name, '南電');
  const none = K.themeSummary(watchlist.themes[1], {});
  assert.equal(none.avg, null);
  assert.deepEqual(Object.keys(s).sort(), ['avg', 'bottom', 'count', 'name', 'top']);
});

test('market status: in session vs. last close with date', () => {
  const q = K.parseMis(fixture);
  assert.deepEqual(K.marketStatus(tp('2026-10-21 10:30'), q).label, '盤中 10:30');
  assert.equal(K.marketStatus(tp('2026-10-21 14:00'), q).label, '今日收盤');
  const sat = K.marketStatus(tp('2026-10-24 10:00'), q);
  assert.equal(sat.open, false);
  assert.equal(sat.label, '收盤 10/21（三）');
  assert.equal(K.marketStatus(tp('2026-10-22 08:30'), q).label, '收盤 10/21（三）');
});

test('weekly change from the local close history', () => {
  let h = {};
  h = K.updateHistory(h, { 2330: { code: '2330', dateKey: '2026-10-16', price: 2300, prev: 2290 } });
  h = K.updateHistory(h, { 2330: { code: '2330', dateKey: '2026-10-21', price: 2420, prev: 2405 } });
  assert.equal(K.weeklyChange(h, '2330', '2026-10-23').toFixed(2), '5.22');
  // Only Monday's quote this week: base = Monday's "y"
  const h2 = K.updateHistory({}, { 2330: { code: '2330', dateKey: '2026-10-19', price: 2350, prev: 2300 } });
  assert.equal(K.weeklyChange(h2, '2330', '2026-10-24').toFixed(2), '2.17');
  // Wednesday only and nothing before → unknown
  assert.equal(K.weeklyChange(K.updateHistory({}, { 2330: { code: '2330', dateKey: '2026-10-21', price: 2420, prev: 2405 } }), '2330', '2026-10-24'), null);
});

test('formatting: thousands separators, ▲▼ and Taiwan red-up / green-down', () => {
  assert.equal(K.formatPrice(2420), '2,420');
  assert.equal(K.formatPrice(341.5), '341.5');
  assert.equal(K.formatPrice(46887.77), '46,887.77');
  assert.equal(K.formatPct(0.6237), '▲0.62%');
  assert.equal(K.formatPct(-1.73), '▼1.73%');
  assert.equal(K.formatPct(0), '0.00%');
  assert.equal(K.trendColor(1), 'up');
  assert.equal(K.trendColor(-1), 'down');
  assert.equal(K.trendColor(0), 'secondary');
  assert.equal(K.formatVolume(22224), '2.2 萬張');
});
