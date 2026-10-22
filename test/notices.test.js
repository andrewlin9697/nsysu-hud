'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const N = require('../src/actions/notices');
const R = require('../src/actions/rpage');
const { tp, readText, configs } = require('./helpers');

const { notices: cfg } = configs();
const src = (id) => cfg.sources.find((s) => s.id === id);
const parse = (id, file) => R.parseList(readText(file), src(id).layout, src(id).url);
const EE = parse('ee-all', 'fixtures/rpage-403-ee.html');
const OAA = parse('oaa-course', 'fixtures/rpage-403-oaa.html');
const MAIN = parse('main-activity', 'fixtures/rpage-422-main.html');

const item = (id, title, date, host = 'oaa.nsysu.edu.tw') => ({ id: `${host}:${id}`, title, url: `https://${host}/p/406-1003-${id},r701.php`, date });

test('first run (no Pages JSON yet): baseline only, nothing pushed', () => {
  const { state, newItems } = N.mergeNotices(null, [{ source: src('ee-all'), items: EE }, { source: src('oaa-course'), items: OAA }], tp('2026-10-22 07:00'));
  assert.equal(newItems.length, 0);
  assert.equal(state.items.length, 7);
  assert.ok(state.items.every((i) => i.quiet));
  assert.equal(state.firstRun, true);
  assert.deepEqual(state.baselinedSources.sort(), ['ee-all', 'oaa-course']);
  assert.deepEqual(Object.keys(state.items[0]).sort(), ['date', 'firstSeen', 'group', 'id', 'quiet', 'source', 'title', 'url']);
});

test('a new post on the next run is pushed; known ones are not', () => {
  const base = N.mergeNotices(null, [{ source: src('ee-all'), items: EE.slice(1) }], tp('2026-10-22 07:00')).state;
  const { state, newItems } = N.mergeNotices(base, [{ source: src('ee-all'), items: EE }], tp('2026-10-22 07:30'));
  assert.deepEqual(newItems.map((i) => i.id), ['web.ee.nsysu.edu.tw:383728']);
  assert.equal(newItems[0].group, '電機系');
  assert.equal(newItems[0].firstSeen, tp('2026-10-22 07:30').toISOString());
  assert.equal(state.items[0].id, 'web.ee.nsysu.edu.tw:383728');
  assert.equal(state.firstRun, false);
});

test('a pinned old post on top does not hide the new one below it', () => {
  const pinned = item(300000, '【置頂】選課須知', '2026-02-01');
  const base = N.mergeNotices(null, [{ source: src('oaa-course'), items: [pinned, ...OAA] }], tp('2026-10-20 07:00')).state;
  const fresh = item(384999, '【公告】期中教學意見調查', '2026-10-22');
  const { newItems } = N.mergeNotices(base, [{ source: src('oaa-course'), items: [pinned, fresh, ...OAA] }], tp('2026-10-22 08:00'));
  assert.deepEqual(newItems.map((i) => i.title), ['【公告】期中教學意見調查']);
});

test('an old-dated post appearing for the first time is recorded quietly', () => {
  const base = N.mergeNotices(null, [{ source: src('oaa-course'), items: OAA }], tp('2026-10-20 07:00')).state;
  const repinned = item(111111, '【置頂】很久以前的公告', '2026-03-01');
  const { state, newItems } = N.mergeNotices(base, [{ source: src('oaa-course'), items: [repinned, ...OAA] }], tp('2026-10-22 08:00'));
  assert.equal(newItems.length, 0);
  assert.equal(state.items.find((i) => i.title.includes('很久以前')).quiet, true);
});

test('the same article in two sources becomes one notice', () => {
  const shared = item(385000, '【重要】115-2 選課時程', '2026-10-22');
  const base = N.mergeNotices(null, [{ source: src('oaa-important'), items: [] }, { source: src('oaa-course'), items: OAA }], tp('2026-10-21 07:00')).state;
  const { state, newItems } = N.mergeNotices(base, [
    { source: src('oaa-important'), items: [shared] },
    { source: src('oaa-course'), items: [shared, ...OAA] },
  ], tp('2026-10-22 09:00'));
  assert.equal(newItems.length, 1);
  const rec = state.items.filter((i) => i.id === shared.id);
  assert.equal(rec.length, 1);
  assert.equal(rec[0].source, 'oaa-important');
  assert.deepEqual(rec[0].sources, ['oaa-important', 'oaa-course']);
});

test('a failing source is recorded in errors and keeps its old items', () => {
  const base = N.mergeNotices(null, [{ source: src('ee-all'), items: EE }, { source: src('main-activity'), items: MAIN }], tp('2026-10-21 07:00')).state;
  const { state, newItems } = N.mergeNotices(base, [
    { source: src('ee-all'), error: 'HTTP 503' },
    { source: src('main-activity'), items: MAIN },
  ], tp('2026-10-21 07:30'));
  assert.equal(newItems.length, 0);
  assert.deepEqual(state.errors.map((e) => [e.source, e.message]), [['ee-all', 'HTTP 503']]);
  assert.equal(state.items.filter((i) => i.source === 'ee-all').length, 4);
  assert.ok(state.baselinedSources.includes('ee-all'));
});

test('a source enabled later only sets its own baseline', () => {
  const base = N.mergeNotices(null, [{ source: src('ee-all'), items: EE }], tp('2026-10-21 07:00')).state;
  const { newItems } = N.mergeNotices(base, [{ source: src('ee-all'), items: EE }, { source: src('main-activity'), items: MAIN }], tp('2026-10-21 07:30'));
  assert.equal(newItems.length, 0);
});

test('keeps at most 200 notices, preferring what is still listed', () => {
  const many = Array.from({ length: 230 }, (_, i) => item(400000 + i, `舊公告 ${i}`, '2026-10-01'));
  const base = N.mergeNotices(null, [{ source: src('oaa-course'), items: many }], tp('2026-10-01 07:00')).state;
  assert.equal(base.items.length, 200);
  const { state } = N.mergeNotices(base, [{ source: src('oaa-course'), items: OAA }], tp('2026-10-22 07:00'));
  assert.equal(state.items.length, 200);
  for (const o of OAA) assert.ok(state.items.some((i) => i.id === o.id));
});

test('push payload: one message per round, titled "中山公告 N 則", clicks to the first', () => {
  const p = N.noticesPayload([
    { group: '電機系', title: 'A', url: 'https://web.ee.nsysu.edu.tw/p/406-1203-1,r2042.php' },
    { group: '教務處', title: 'B', url: 'https://oaa.nsysu.edu.tw/p/406-1003-2,r701.php' },
    { group: '住宿', title: 'C', url: 'https://housing-osa.nsysu.edu.tw/p/406-1092-3,r3512.php' },
  ]);
  assert.deepEqual(p, {
    title: '中山公告 3 則',
    message: '【電機系】A\n【教務處】B\n【住宿】C',
    click: 'https://web.ee.nsysu.edu.tw/p/406-1203-1,r2042.php',
    tags: ['loudspeaker'],
    priority: 3,
  });
  assert.equal(N.noticesPayload([]), null);
  const long = N.noticesPayload(Array.from({ length: 12 }, (_, i) => ({ group: '教務處', title: `T${i}`, url: 'https://x/' })));
  assert.equal(long.message.split('\n').length, 9);
  assert.match(long.message, /還有 4 則/);
});

test('notices are due every ~30 minutes regardless of cron jitter', () => {
  assert.equal(N.noticesDue(null, tp('2026-10-22 07:00')), true);
  assert.equal(N.noticesDue({ checkedAt: tp('2026-10-22 07:00').toISOString() }, tp('2026-10-22 07:20')), false);
  assert.equal(N.noticesDue({ checkedAt: tp('2026-10-22 07:00').toISOString() }, tp('2026-10-22 07:26')), true);
});
