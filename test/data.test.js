'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../src/widget/data');
const C = require('../src/widget/constants');
const { createFakeAdapter } = require('../src/dev/fake-adapter');
const { tp } = require('./helpers');

test('cachedJson: fresh cache, refetch after TTL, stale cache when offline', async () => {
  let n = 0;
  const a = createFakeAdapter({ now: tp('2026-10-22 07:00'), routes: [{ match: 'x.test', json: () => ({ n: ++n }) }] });
  assert.equal((await D.cachedJson(a, 'k', 'https://x.test/a', { ttl: 30 })).json.n, 1);
  a.setNow(tp('2026-10-22 07:20'));
  const c = await D.cachedJson(a, 'k', 'https://x.test/a', { ttl: 30 });
  assert.equal(c.json.n, 1);
  assert.equal(c.fromCache, true);
  a.setNow(tp('2026-10-22 07:31'));
  assert.equal((await D.cachedJson(a, 'k', 'https://x.test/a', { ttl: 30 })).json.n, 2);
  // offline later: the old copy comes back with an error and its original time
  const off = createFakeAdapter({ now: tp('2026-10-22 09:00'), cache: a.cache });
  const s = await D.cachedJson(off, 'k', 'https://x.test/a', { ttl: 30 });
  assert.equal(s.json.n, 2);
  assert.ok(s.error);
  assert.equal(s.fetchedAt, tp('2026-10-22 07:31').toISOString());
});

test('cachedJson: 404 on Pages means "not created yet"; validation errors fall back', async () => {
  const a = createFakeAdapter({ now: tp('2026-10-22 07:00'), routes: [{ match: 'pages', status: 404, body: 'Not Found' }, { match: 'bad', json: { msgArray: [] } }] });
  const m = await D.cachedJson(a, 'n', 'https://pages/x.json', { allow404: true });
  assert.equal(m.missing, true);
  assert.equal(m.json, null);
  const v = await D.cachedJson(a, 's', 'https://bad/x', { validate: (j) => j.msgArray.length > 0 || '空的' });
  assert.equal(v.json, null);
  assert.equal(v.error, '空的');
});

test('loadConfig: downloaded configs win, built-in copies cover a first offline run', async () => {
  const off = await D.loadConfig(createFakeAdapter({ now: tp('2026-10-22 07:00') }));
  assert.equal(off.courses.courses.length, 8);
  assert.equal(off._sources.courses, 'builtin');
  const custom = { ...off.watchlist, pinned: [{ code: '2317', name: '鴻海', market: 'tse' }] };
  const on = await D.loadConfig(createFakeAdapter({ now: tp('2026-10-22 07:00'), routes: [{ match: `${C.RAW_BASE}/config/watchlist.json`, json: custom }] }));
  assert.equal(on.watchlist.pinned[0].name, '鴻海');
  assert.equal(on._sources.watchlist, 'network');
});

test('calendar permission denied is reported, not thrown', async () => {
  const r = await D.loadCalendar(createFakeAdapter({ calendar: 'deny' }), tp('2026-10-22 07:00'));
  assert.deepEqual(r.events, []);
  assert.match(r.error, /行事曆/);
});

test('stock cache is short during trading hours only', () => {
  assert.equal(D.stockTtl(tp('2026-10-22 10:00')), 2);
  assert.equal(D.stockTtl(tp('2026-10-22 20:00')), 30);
  assert.equal(D.stockTtl(tp('2026-10-24 10:00')), 30);
});
