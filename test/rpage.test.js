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

test('rpage-422 without data-th (labels added by the page script): header row or cell content', () => {
  const real = readText('fixtures/rpage-422-main.html');
  const bare = real.replace(/ data-th="[^"]*"/g, '');
  const expected = R.parseList(real, 'rpage-422', MAIN);
  // no labels at all: title = the cell with the link, date = the date-looking cell, unit = [..]
  assert.deepEqual(R.parseList(bare, 'rpage-422', MAIN), expected);
  // a <thead> row, columns in a different order, English labels
  const reordered = `<div class="module module-ptlist"><table><thead><tr><th>Title</th><th> Unit </th><th>Date</th></tr></thead><tbody>
    <tr><td><a href="https://la.nsysu.edu.tw/p/404-1016-384504.php?Lang=zh-tw">論壇</a></td><td>[文學院]</td><td>2026-10-20</td></tr>
    </tbody></table></div>`;
  assert.deepEqual(R.parse422(reordered, MAIN), [{ url: 'https://la.nsysu.edu.tw/p/404-1016-384504.php', title: '論壇', id: 'la.nsysu.edu.tw:384504', date: '2026-10-20', unit: '文學院' }]);
});

test('rpage-422 falls back to 403-style rows inside .module-ptlist only', () => {
  const html = `<div class="module module-special"><div class="row listBS"><div class="mtitle"><a href="https://news.nsysu.edu.tw/p/406-1120-1,r2910.php">輪播</a></div></div></div>
    <div class="module module-ptlist"><div class="row listBS"><div class="mtitle"><a href="https://www.nsysu.edu.tw/p/406-1000-2,r1338.php">列表</a><i class="mdate">2026.10.21</i></div></div></div>`;
  assert.deepEqual(R.parse422(html, MAIN).map((i) => [i.title, i.date]), [['列表', '2026-10-21']]);
});

test('describePage explains an unparseable page', () => {
  const d = R.describePage('<html><head><title>請稍候</title></head><body><script>location.reload()</script><div id="app"></div></body></html>');
  assert.match(d, /^HTML \d+ 字，標題「請稍候」，module-ptlist 0 個，區塊內表格 0 個、tr 0 個，區塊內文章連結 0 個，全頁文章連結 0 個$/);
});

test('rpage-422 survives messy CMS markup: stray </div>, attributes without spaces', () => {
  const html = `<div class="module module-special"><a href="https://news.nsysu.edu.tw/p/406-1120-1,r2910.php">輪播</a></div>
    <div class="module module-ptlist"><div class="mb"></div></div>
      <div id="pageptlist"><table class="listTB"><tr><td data-th="日期">2026-10-21</td><td data-th="標題"><div class="mtitle"><a title="甲公告(另開新視窗)"href="https://www.nsysu.edu.tw/p/406-1000-11,r1338.php">x</a></div></td><td data-th="公告單位">[教務處]</td></tr>
      <tr><td data-th="日期">2026-10-20</td><td data-th="標題"><a href="https://www.nsysu.edu.tw/p/406-1000-12,r1338.php">乙公告</a></td><td data-th="公告單位">[學務處]</td></tr></table></div>
    </div>
    <div class="module module-footer"><a href="https://www.nsysu.edu.tw/p/406-1000-99,r1.php">頁尾連結</a></div>`;
  const items = R.parse422(html, MAIN);
  assert.deepEqual(items.map((i) => [i.title, i.date, i.unit]), [['甲公告', '2026-10-21', '教務處'], ['乙公告', '2026-10-20', '學務處']]);
  assert.match(R.describePage(html), /module-ptlist 1 個，區塊內表格 1 個、tr 2 個，區塊內文章連結 2 個，全頁文章連結 4 個$/);
  assert.ok(R.listExcerpt(html).startsWith('<div class="module module-ptlist"><div class="mb"></div></div> <div id="pageptlist">'));
  assert.ok(!R.listExcerpt(html).includes('頁尾連結'));
});

test('rpage-403 rows with attributes glued together', () => {
  const html = `<div class="row listBS"id="r1"><div class="mtitle"><a href="/p/406-1003-5,r701.php"title="丙公告">丙</a><i class="mdate after">2026.10.22</i></div></div>`;
  assert.deepEqual(R.parse403(html, OAA).map((i) => [i.title, i.date, i.id]), [['丙公告', '2026-10-22', 'oaa.nsysu.edu.tw:5']]);
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
