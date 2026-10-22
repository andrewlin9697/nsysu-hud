'use strict';
// The one job that builds the GitHub Pages site (data/*.json). Every deploying workflow runs it,
// so each deploy carries all files forward and no workflow overwrites another one's data.

const fs = require('fs');
const path = require('path');
const T = require('../lib/time');
const { getText, getJson, errorText } = require('./http');
const { fetchPrevious, DEFAULT_PAGES_BASE } = require('./pages');
const R = require('./rpage');
const N = require('./notices');
const CW = require('./course-watch');
const { pickStations } = require('../widget/feeds');

const ROOT = path.join(__dirname, '..', '..');

function readConfig(name, root = ROOT) {
  return JSON.parse(fs.readFileSync(path.join(root, 'config', `${name}.json`), 'utf8'));
}

async function runNotices(cfg, prev, ctx) {
  const sources = cfg.sources.filter((s) => s.enabled);
  const results = await Promise.all(sources.map(async (source) => {
    let html = null;
    try {
      html = await getText(source.url, ctx.http);
      const items = R.parseList(html, source.layout, source.url);
      if (!items.length) throw new Error(`解析不到任何公告（${R.describePage(html)}）`);
      return { source, items };
    } catch (e) {
      // For pages that load but don't parse, keep the start of the list markup for the job log.
      return { source, error: errorText(e), excerpt: html ? R.listExcerpt(html) : null };
    }
  }));
  const { state, newItems } = N.mergeNotices(prev, results, ctx.now);
  for (const r of results) {
    ctx.log(r.error ? `  ✗ ${r.source.name}：${r.error}` : `  ✓ ${r.source.name}：${r.items.length} 則`);
    if (r.excerpt) ctx.log(`    列表區塊開頭（除錯用）：${r.excerpt}`);
  }
  if (state.firstRun) ctx.log('  第一次執行：只建立基準，不推播。');
  ctx.log(`  新公告 ${newItems.length} 則${newItems.length ? '：' : ''}`);
  for (const i of newItems) ctx.log(`    【${i.group}】${i.title}`);
  return { state, push: N.noticesPayload(newItems) };
}

async function runYoubike(cfg, prev, ctx) {
  try {
    const feed = await getJson(cfg.feedUrl, { ...ctx.http, timeoutMs: 60000 });
    const { stations, missing } = pickStations(feed, cfg.stations);
    const errors = missing.map((m) => ({ source: `station:${m.no}`, message: `資料中找不到「${m.name}」`, at: ctx.now.toISOString() }));
    ctx.log(`  ✓ 站點 ${stations.length} 個${missing.length ? `，找不到 ${missing.length} 個` : ''}`);
    return { version: 1, updatedAt: ctx.now.toISOString(), source: cfg.feedUrl, stations, errors };
  } catch (e) {
    ctx.log(`  ✗ YouBike：${errorText(e)}（保留上一次的資料）`);
    return {
      version: 1,
      updatedAt: (prev && prev.updatedAt) || null,
      source: cfg.feedUrl,
      stations: (prev && prev.stations) || [],
      errors: [{ source: 'station-yb2.json', message: errorText(e), at: ctx.now.toISOString() }],
    };
  }
}

async function runCourseWatch(cfg, coursesCfg, prev, ctx) {
  const watch = cfg.courseWatch;
  const labels = {};
  for (const c of coursesCfg.courses || []) labels[c.id] = c.short || c.name;
  const errors = [];
  try {
    const version = await getJson(watch.versionUrl, ctx.http);
    const latest = CW.resolveLatest(version);
    if (!latest) throw new Error('version.json 裡沒有 latest');
    const dataUrl = watch.dataUrlTemplate.replace('{latest}', latest);
    const all = await getJson(dataUrl, { ...ctx.http, timeoutMs: 60000 });
    let complete = true;
    try {
      const info = await getJson(dataUrl.replace(/all\.json$/, 'info.json'), ctx.http);
      complete = info.complete !== false;
    } catch (e) {
      // info.json is optional
    }
    const { messages, snapshots } = CW.diffCourses(prev && prev.courses, all, watch.courseIds, labels, { complete });
    if (!complete) errors.push({ source: 'info.json', message: '這一版課程資料不完整，找不到的課先不通知', at: ctx.now.toISOString() });
    const state = CW.buildState(prev, { now: ctx.now, dataVersion: latest, snapshots, messages, errors });
    ctx.log(`  ✓ 課程資料版本 ${latest}${prev ? '' : '（第一次：只建立基準）'}，異動 ${messages.length} 則`);
    for (const m of messages) ctx.log(`    ${m.message}`);
    const urls = {};
    for (const [id, s] of Object.entries(snapshots)) if (s && s.url) urls[id] = s.url;
    return { state, push: CW.coursePayload(messages, urls) };
  } catch (e) {
    ctx.log(`  ✗ 課程資料：${errorText(e)}`);
    const state = prev ? { ...prev, errors: [{ source: 'NSYSUCourseAPI', message: errorText(e), at: ctx.now.toISOString() }] } : null;
    return { state, push: null };
  }
}

function indexHtml(now) {
  return `<!doctype html>
<html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>NSYSU HUD 資料</title>
<style>body{font:16px -apple-system,system-ui,sans-serif;max-width:40rem;margin:2rem auto;padding:0 1rem;color:#1c1c1e;background:#fff}
@media (prefers-color-scheme:dark){body{color:#f2f2f7;background:#000}a{color:#0a84ff}}</style></head>
<body><h1>NSYSU HUD 資料</h1><p>給 Scriptable 小工具讀取的 JSON，由 GitHub Actions 自動產生。</p>
<ul><li><a href="data/notices.json">notices.json</a>（公告）</li><li><a href="data/youbike.json">youbike.json</a>（YouBike 站點）</li><li><a href="data/course-state.json">course-state.json</a>（課程異動監看）</li></ul>
<p>最後部署：${T.dateKey(now)} ${T.hm(now)}（台北時間）</p></body></html>
`;
}

/**
 * opts: { tasks: Set('notices'|'youbike'|'course'), force: Set, now, pagesBase, outDir, pendingFile,
 *         fetch, sleep, log, root }
 * → { ok, deploy, pushes, summary }
 */
async function runDataJob(opts) {
  const now = opts.now || new Date();
  const log = opts.log || console.log;
  const root = opts.root || ROOT;
  const tasks = opts.tasks || new Set(['notices', 'youbike', 'course']);
  const force = opts.force || new Set();
  const base = opts.pagesBase || DEFAULT_PAGES_BASE;
  const http = { fetch: opts.fetch, sleep: opts.sleep };
  const ctx = { now, log, http };

  log(`台北時間 ${T.dateKey(now)} ${T.hm(now)}；工作：${[...tasks].join('、')}`);
  const [pNotices, pYoubike, pCourse] = await Promise.all(
    ['notices.json', 'youbike.json', 'course-state.json'].map((f) => fetchPrevious(base, f, http)));

  // notices.json and youbike.json are always deployed together, so one missing while the other
  // exists means Pages hiccupped — never mistake that for a first run (it would drop pushes).
  if (pNotices.status === 'missing' && pYoubike.status === 'ok') {
    pNotices.status = 'error';
    pNotices.error = 'notices.json 暫時讀不到（youbike.json 卻在）';
  }
  const prevErrors = [['notices.json', pNotices], ['youbike.json', pYoubike], ['course-state.json', pCourse]]
    .filter(([, p]) => p.status === 'error');
  if (prevErrors.length) {
    for (const [f, p] of prevErrors) log(`讀不到 Pages 上的 ${f}：${p.error}`);
    log('為了不弄丟狀態，這一輪不部署也不推播。');
    return { ok: false, deploy: false, pushes: [] };
  }

  const files = {
    'notices.json': pNotices.data || null,
    'youbike.json': pYoubike.data || null,
    'course-state.json': pCourse.data || null,
  };
  const pushes = [];

  if (tasks.has('youbike')) {
    log('YouBike：');
    files['youbike.json'] = await runYoubike(readConfig('youbike', root), files['youbike.json'], ctx);
  }

  if (tasks.has('notices')) {
    if (force.has('notices') || N.noticesDue(files['notices.json'], now)) {
      log('公告：');
      const r = await runNotices(readConfig('notices', root), files['notices.json'], ctx);
      files['notices.json'] = r.state;
      if (r.push) pushes.push({ kind: 'notices', payload: r.push });
    } else {
      log('公告：距離上次檢查不到 25 分鐘，這輪跳過。');
    }
  }

  if (tasks.has('course')) {
    if (force.has('course') || CW.courseDue(files['course-state.json'], now)) {
      log('課程異動：');
      const r = await runCourseWatch(readConfig('notices', root), readConfig('courses', root), files['course-state.json'], ctx);
      if (r.state) files['course-state.json'] = r.state;
      if (r.push) pushes.push({ kind: 'course', payload: r.push });
    } else {
      log('課程異動：今天已經檢查過（或還沒到 09:00 的補跑時間），跳過。');
    }
  }

  if (opts.outDir) {
    const dataDir = path.join(opts.outDir, 'data');
    fs.mkdirSync(dataDir, { recursive: true });
    for (const [name, data] of Object.entries(files)) {
      if (data) fs.writeFileSync(path.join(dataDir, name), `${JSON.stringify(data, null, 1)}\n`);
    }
    fs.writeFileSync(path.join(opts.outDir, 'index.html'), indexHtml(now));
    fs.writeFileSync(path.join(opts.outDir, '.nojekyll'), '');
  }
  if (opts.pendingFile) {
    fs.mkdirSync(path.dirname(opts.pendingFile), { recursive: true });
    fs.writeFileSync(opts.pendingFile, `${JSON.stringify(pushes, null, 2)}\n`);
  }
  log(`完成：要推播 ${pushes.length} 則。`);
  return { ok: true, deploy: true, pushes, files };
}

module.exports = { runDataJob, runNotices, runYoubike, runCourseWatch, readConfig };
