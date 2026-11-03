#!/usr/bin/env node
'use strict';
// Runs after the Pages deploy succeeded: sends the pushes collected by data-job.js
// (including scheduled EEARS reminders and cancellations of ones that no longer apply).
// Env: NTFY_TOPIC (secret, never printed), DRY_RUN=true to only print.

const fs = require('fs');
const path = require('path');
const { sendNtfy, cancelNtfy } = require('../src/actions/ntfy');

async function main() {
  const file = process.env.PENDING_FILE || path.join(__dirname, '..', '_pending', 'pushes.json');
  if (!fs.existsSync(file)) {
    console.log('沒有待推播的內容。');
    return;
  }
  const pushes = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!pushes.length) {
    console.log('沒有新的內容要推播。');
    return;
  }
  const dryRun = /^(1|true|yes)$/i.test(process.env.DRY_RUN || '');
  const opts = { topic: process.env.NTFY_TOPIC, dryRun };
  for (const p of pushes) {
    if (p.cancel) await cancelNtfy(p.cancel, opts);
    else await sendNtfy(p.payload, opts);
  }
}

main().catch((e) => {
  console.error(`推播失敗：${e && e.message}`);
  process.exitCode = 1;
});
