'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../src/actions/rpage');
const { readText } = require('./helpers');

const EE = 'https://web.ee.nsysu.edu.tw/p/403-1203-2042-1.php';
const OAA = 'https://oaa.nsysu.edu.tw/p/403-1003-701-1.php';
const MAIN = 'https://www.nsysu.edu.tw/p/422-1000-1338.php';

test('rpage-403 (電機系, no dates)', () => {
  const items = R.parseList(readText('fixtures/rpage-403-ee.html'), 'rpage-403', EE);
  assert.equal(items.length, 4);
  assert.deepEqual(items[0], {
    url: 'https://web.ee.nsysu.edu.tw/p/406-1203-383728,r2042.php',
    title: '【公告】誠徵工學院電機系專題競賽暨展示工讀生 - 11/19 (四)上午9時至下午5時',
    id: 'web.ee.nsysu.edu.tw:383728',
    date: null,
  });
  assert.ok(items.every((i) => !i.url.includes('Lang=')));
});

test('rpage-403 (教務處, with i.mdate and "(另開新視窗)")', () => {
  const items = R.parseList(readText('fixtures/rpage-403-oaa.html'), 'rpage-403', OAA);
  assert.deepEqual(items.map((i) => i.date), ['2026-10-02', '2026-09-14', '2026-08-20']);
  assert.equal(items[1].title, '【開放報名】台積電NTC 半導體實務課程 — 敬邀同學踴躍報名！');
  assert.equal(items[1].id, 'oaa.nsysu.edu.tw:382121');
});

test('rpage-422 parses only the .module-ptlist table, not the news carousel', () => {
  const items = R.parseList(readText('fixtures/rpage-422-main.html'), 'rpage-422', MAIN);
  assert.equal(items.length, 3);
  assert.ok(items.every((i) => !i.url.includes('news.nsysu.edu.tw')));
  assert.deepEqual(items.map((i) => i.id), ['la.nsysu.edu.tw:384504', 'la.nsysu.edu.tw:384503', 'arcuv.nsysu.edu.tw:384280']);
  assert.equal(items[0].date, '2026-10-20');
  assert.equal(items[0].unit, '國立中山大學文學院');
  assert.equal(items[0].title, '「蛾、藍猴與穿山甲：梁志英的跨太平洋詩學」論壇 18 Nov. 2026, 10:00-17:00');
});

test('robust to attribute order, relative links, entities, scripts and nesting', () => {
  const html = `
    <script>var s = '<div class="row listBS"><div class="mtitle"><a href="/p/406-1-1.php">假的</a></div></div>';</script>
    <div class="listBS  row boxSD"><div class="mtitle"><a title="A &amp; B（另開新視窗）" href="/p/406-1003-111,r701.php?Lang=zh-tw&amp;x=1">x</a>
      <i class="mdate after">2026.9.3</i></div></div>
    <div class="row listBS"><div class="mtitle"><a href='https://oaa.nsysu.edu.tw/p/404-1003-222.php'><span>只有文字</span> &#x6A19;題</a></div></div>
    <div class="row"><div class="mtitle"><a href="/p/406-1003-333.php">不在 listBS 裡</a></div></div>`;
  const items = R.parse403(html, OAA);
  assert.equal(items.length, 2);
  assert.equal(items[0].title, 'A & B');
  assert.equal(items[0].url, 'https://oaa.nsysu.edu.tw/p/406-1003-111,r701.php?x=1');
  assert.equal(items[0].date, '2026-09-03');
  assert.equal(items[1].title, '只有文字 標題');
  assert.equal(items[1].id, 'oaa.nsysu.edu.tw:222');
});

test('article key uses the second number of /p/40[46]-(\\d+)-(\\d+)', () => {
  assert.equal(R.articleKey('https://web.ee.nsysu.edu.tw/p/406-1203-383728,r2042.php'), 'web.ee.nsysu.edu.tw:383728');
  assert.equal(R.articleKey('https://la.nsysu.edu.tw/p/404-1016-384504.php'), 'la.nsysu.edu.tw:384504');
  assert.equal(R.articleKey('https://example.com/other/page.html'), 'example.com:/other/page.html');
  assert.equal(R.normalizeUrl('javascript:void(0)', EE), null);
});
