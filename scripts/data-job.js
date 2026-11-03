#!/usr/bin/env node
'use strict';
// GitHub Actions entry: build _site/ (data/*.json for Pages) and _pending/pushes.json.
// Usage: node scripts/data-job.js --tasks youbike,notices,course,activities [--force notices,course]
// Env:   PAGES_BASE (default https://andrewlin9697.github.io/nsysu-hud), OUT_DIR, PENDING_FILE

const path = require('path');
const { runDataJob } = require('../src/actions/data-job');

function argList(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  const raw = i >= 0 ? process.argv[i + 1] : process.env[name.toUpperCase()];
  const list = String(raw || fallback || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (list.includes('all')) return new Set(['notices', 'youbike', 'course', 'activities']);
  return new Set(list);
}

async function main() {
  const root = path.join(__dirname, '..');
  const result = await runDataJob({
    tasks: argList('tasks', 'notices,youbike,course,activities'),
    force: argList('force', ''),
    pagesBase: process.env.PAGES_BASE || undefined,
    outDir: process.env.OUT_DIR || path.join(root, '_site'),
    pendingFile: process.env.PENDING_FILE || path.join(root, '_pending', 'pushes.json'),
  });
  if (!result.ok) process.exitCode = 1;
}

main().catch((e) => {
  console.error(`資料工作失敗：${e && e.message}`);
  process.exitCode = 1;
});
