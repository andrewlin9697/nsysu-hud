'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { runDataJob } = require('../src/actions/data-job');
const { tp, readText, readJson, configs } = require('./helpers');

const BASE = 'https://pages.test/nsysu-hud';
const cfg = configs();

function res(status, body) {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return { ok: status >= 200 && status < 300, status, text: async () => text, json: async () => JSON.parse(text) };
}

// A fake internet: Pages state (or 404), the NSYSU sites (fixtures), YouBike, NSYSUCourseAPI.
function internet(opts = {}) {
  const pages = opts.pages || {};
  const html = {
    'web.ee.nsysu.edu.tw': opts.eeHtml || readText('fixtures/rpage-403-ee.html'),
    'oaa.nsysu.edu.tw': readText('fixtures/rpage-403-oaa.html'),
    'www.nsysu.edu.tw': readText('fixtures/rpage-422-main.html'),
    'housing-osa.nsysu.edu.tw': readText('fixtures/rpage-403-oaa.html').replace(/oaa\.nsysu\.edu\.tw\/p\/406-1003/g, 'housing-osa.nsysu.edu.tw/p/406-1092'),
  };
  const calls = [];
  const fetch = async (url) => {
    calls.push(url);
    const u = new URL(url);
    if (url.startsWith(`${BASE}/data/`)) {
      const name = u.pathname.split('/').pop();
      if (opts.pagesDown) throw new TypeError('fetch failed');
      return name in pages ? res(200, pages[name]) : res(404, 'Not Found');
    }
    if (u.hostname === 'apis.youbike.com.tw') {
      if (opts.youbikeDown) return res(503, 'busy');
      return res(200, readJson('fixtures/youbike-station-sample.json').map((s) => ({ ...s, available_spaces: opts.bikes == null ? s.available_spaces : opts.bikes })));
    }
    if (u.hostname === 'nsysu-opendev.github.io') {
      if (url.endsWith('version.json')) return res(200, { latest: '20261022_080000', history: {} });
      if (url.endsWith('info.json')) return res(200, { complete: true });
      return res(200, opts.courses || readJson('fixtures/course-api-sample.json'));
    }
    if (opts.downHosts && opts.downHosts.includes(u.hostname)) return res(503, 'down');
    if (html[u.hostname]) return res(200, html[u.hostname]);
    throw new TypeError('fetch failed');
  };
  return { fetch, calls };
}

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'nsysu-hud-'));
}

async function run(net, now, extra = {}) {
  const dir = tmp();
  const logs = [];
  const r = await runDataJob({
    now, pagesBase: BASE, fetch: net.fetch, sleep: async () => {}, log: (m) => logs.push(m),
    outDir: path.join(dir, '_site'), pendingFile: path.join(dir, '_pending', 'pushes.json'), ...extra,
  });
  const read = (f) => {
    const p = path.join(dir, '_site', 'data', f);
    return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
  };
  return { r, dir, logs, read, pending: fs.existsSync(path.join(dir, '_pending', 'pushes.json')) ? JSON.parse(fs.readFileSync(path.join(dir, '_pending', 'pushes.json'), 'utf8')) : null };
}

test('first run (Pages JSON not there yet): baseline everything, push nothing', async () => {
  const out = await run(internet(), tp('2026-10-22 08:03'), { force: new Set(['course']) });
  assert.equal(out.r.ok, true);
  assert.deepEqual(out.pending, []);
  const notices = out.read('notices.json');
  assert.equal(notices.firstRun, true);
  assert.ok(notices.items.length > 0 && notices.items.every((i) => i.quiet));
  const enabled = cfg.notices.sources.filter((s) => s.enabled).map((s) => s.id).sort();
  assert.deepEqual(notices.baselinedSources.slice().sort(), enabled);
  const yb = out.read('youbike.json');
  assert.equal(yb.stations.length, 1);
  assert.equal(yb.stations[0].bikes, 4);
  assert.equal(yb.stations[0].updated, '2026-10-22T02:55:33+08:00');
  assert.equal(yb.errors.length, cfg.youbike.stations.length - 1); // the sample feed only has one station
  assert.equal(out.read('course-state.json').dataVersion, '20261022_080000');
  assert.ok(fs.existsSync(path.join(out.dir, '_site', 'index.html')));
  assert.ok(fs.existsSync(path.join(out.dir, '_site', '.nojekyll')));
});

test('next run: new notice and course change are pushed after deploy', async () => {
  const first = await run(internet(), tp('2026-10-22 08:03'), { force: new Set(['course']) });
  const pages = { 'notices.json': first.read('notices.json'), 'youbike.json': first.read('youbike.json'), 'course-state.json': first.read('course-state.json') };
  const eeHtml = readText('fixtures/rpage-403-ee.html').replace('<div id="pageptlist">',
    '<div id="pageptlist"><div class="row listBS"><div class="mtitle"><a href="https://web.ee.nsysu.edu.tw/p/406-1203-385001,r2042.php?Lang=zh-tw" title="【公告】期中考教室安排">x</a></div></div>');
  const courses = [{ ...readJson('fixtures/course-api-sample.json')[0], room: '五5,6,7(工EC 2011)', url: 'https://selcrs.nsysu.edu.tw/menu5/showoutline.asp?x=PHY102E' }];
  const out = await run(internet({ pages, eeHtml, courses }), tp('2026-10-22 08:40'), { force: new Set(['course']) });
  assert.deepEqual(out.pending.map((p) => p.kind), ['notices', 'course']);
  assert.equal(out.pending[0].payload.title, '中山公告 1 則');
  assert.equal(out.pending[0].payload.message, '【電機系】【公告】期中考教室安排');
  assert.equal(out.pending[0].payload.click, 'https://web.ee.nsysu.edu.tw/p/406-1203-385001,r2042.php');
  assert.equal(out.pending[1].payload.message, '普物教室改到 工EC 2011');
  assert.equal(out.pending[1].payload.priority, 4);
  const state = out.read('course-state.json');
  assert.equal(state.changes[0].message, '普物教室改到 工EC 2011');
});

test('notices are skipped when checked < 25 minutes ago; the file is carried forward', async () => {
  const first = await run(internet(), tp('2026-10-22 08:03'));
  const pages = { 'notices.json': first.read('notices.json'), 'youbike.json': first.read('youbike.json') };
  const net = internet({ pages });
  const out = await run(net, tp('2026-10-22 08:13'));
  assert.ok(!net.calls.some((u) => u.includes('nsysu.edu.tw/p/')));
  assert.deepEqual(out.read('notices.json'), pages['notices.json']);
  assert.notDeepEqual(out.read('youbike.json').updatedAt, pages['youbike.json'].updatedAt);
});

test('one source failing does not fail the round', async () => {
  const out = await run(internet({ downHosts: ['housing-osa.nsysu.edu.tw'] }), tp('2026-10-22 08:03'));
  assert.equal(out.r.ok, true);
  const errs = out.read('notices.json').errors;
  assert.deepEqual(errs.map((e) => e.source).sort(), ['housing-apply', 'housing-construction', 'housing-latest']);
  assert.equal(errs[0].message, 'HTTP 503');
});

test('YouBike failure keeps the previous stations and records the error', async () => {
  const first = await run(internet(), tp('2026-10-22 08:03'));
  const pages = { 'notices.json': first.read('notices.json'), 'youbike.json': first.read('youbike.json') };
  const out = await run(internet({ pages, youbikeDown: true }), tp('2026-10-22 08:13'));
  const yb = out.read('youbike.json');
  assert.deepEqual(yb.stations, pages['youbike.json'].stations);
  assert.equal(yb.updatedAt, pages['youbike.json'].updatedAt);
  assert.equal(yb.errors[0].message, 'HTTP 503');
});

test('Pages unreachable → no deploy, no push (state is never lost)', async () => {
  const out = await run(internet({ pagesDown: true }), tp('2026-10-22 08:03'));
  assert.equal(out.r.ok, false);
  assert.equal(out.r.deploy, false);
  assert.equal(out.read('notices.json'), null);
});

test('notices.json missing while youbike.json exists is treated as a hiccup, not a first run', async () => {
  const out = await run(internet({ pages: { 'youbike.json': { stations: [] } } }), tp('2026-10-22 08:03'));
  assert.equal(out.r.ok, false);
  assert.match(out.logs.join('\n'), /暫時讀不到/);
});
