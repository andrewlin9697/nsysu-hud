'use strict';
// install/HUD-Loader.js in a sandbox: download, daily update check, offline fallback.
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const { createScriptableEnv } = require('../src/dev/fake-scriptable');
const { freezeClock } = require('../src/dev/run-bundle');
const { ROOT } = require('./helpers');

const LOADER = fs.readFileSync(path.join(ROOT, 'install/HUD-Loader.js'), 'utf8');
const URL_ = 'https://raw.githubusercontent.com/andrewlin9697/nsysu-hud/main/dist/NSYSU-HUD.js';
const fakeBundle = (tag) => `// NSYSU-HUD fake\nmodule.exports = { run: async (o) => { globalThis.__ran = ${JSON.stringify(tag)} + ':' + o.path; } };`;

async function runLoader({ now, files = {}, fetch }) {
  const env = createScriptableEnv({ files, fetch, now: () => now });
  const ctx = vm.createContext({ ...env.globals, console: { log() {} } });
  freezeClock(ctx, now);
  await vm.runInContext(`(async () => {\n${LOADER}\n})()`, ctx);
  return { ran: ctx.__ran, requests: env.record.requests, files };
}

test('the installer stays short (10–20 lines)', () => {
  const lines = LOADER.trim().split('\n').length;
  assert.ok(lines >= 10 && lines <= 20, `${lines} lines`);
  assert.ok(LOADER.includes(URL_));
});

test('first run downloads, caches and runs the main script', async () => {
  const r = await runLoader({ now: new Date('2026-10-22T00:00:00Z'), fetch: async () => ({ status: 200, body: fakeBundle('v1') }) });
  assert.deepEqual(r.requests, [URL_]);
  assert.equal(r.ran, 'v1:/Library/NSYSU-HUD.js');
  assert.ok(r.files['/Library/NSYSU-HUD.js'].content.includes('NSYSU-HUD'));
});

test('checks for updates only once a day', async () => {
  const files = { '/Library/NSYSU-HUD.js': { content: fakeBundle('cached'), mtime: new Date('2026-10-22T00:00:00Z') } };
  const soon = await runLoader({ now: new Date('2026-10-22T10:00:00Z'), files, fetch: async () => ({ status: 200, body: fakeBundle('new') }) });
  assert.deepEqual(soon.requests, []);
  assert.equal(soon.ran, 'cached:/Library/NSYSU-HUD.js');
  const later = await runLoader({ now: new Date('2026-10-23T01:00:00Z'), files, fetch: async () => ({ status: 200, body: fakeBundle('new') }) });
  assert.equal(later.ran, 'new:/Library/NSYSU-HUD.js');
});

test('network failure or a bad response keeps using the cached copy', async () => {
  const files = { '/Library/NSYSU-HUD.js': { content: fakeBundle('cached'), mtime: new Date('2026-10-01T00:00:00Z') } };
  const down = await runLoader({ now: new Date('2026-10-22T10:00:00Z'), files, fetch: async () => { throw new Error('offline'); } });
  assert.equal(down.ran, 'cached:/Library/NSYSU-HUD.js');
  const bad = await runLoader({ now: new Date('2026-10-22T10:00:00Z'), files, fetch: async () => ({ status: 404, body: '404: Not Found' }) });
  assert.equal(bad.ran, 'cached:/Library/NSYSU-HUD.js');
});

test('first run without network explains what to do', async () => {
  await assert.rejects(
    runLoader({ now: new Date('2026-10-22T10:00:00Z'), fetch: async () => { throw new Error('offline'); } }),
    /第一次使用需要網路/,
  );
});

test('the real bundle runs through the real loader', async () => {
  const code = fs.readFileSync(path.join(ROOT, 'dist/NSYSU-HUD.js'), 'utf8');
  const env = createScriptableEnv({ runsInWidget: true, family: 'small', fetch: async (u) => (u === URL_ ? { status: 200, body: code } : { status: 404, body: '' }), now: () => new Date('2026-10-21T23:30:00Z') });
  const ctx = vm.createContext({ ...env.globals, console: { log() {} } });
  freezeClock(ctx, new Date('2026-10-21T23:30:00Z'));
  await vm.runInContext(`(async () => {\n${LOADER}\n})()`, ctx);
  assert.equal(env.record.completed, true);
  assert.ok(env.record.widget);
});
