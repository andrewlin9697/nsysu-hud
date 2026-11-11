#!/usr/bin/env node
'use strict';
// Runs after the Pages deploy succeeded: sends the pushes collected by data-job.js
// (including scheduled EEARS reminders and cancellations of ones that no longer apply).
// Env: NTFY_TOPIC (secret, never printed), DRY_RUN=true to only print.
// Exits 1 when a push could not be delivered (no topic, network down, HTTP error).

const fs = require('fs');
const path = require('path');
const { sendAll } = require('../src/actions/ntfy');

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
  const { failed } = await sendAll(pushes, { topic: process.env.NTFY_TOPIC, dryRun });
  if (failed) {
    // The state was already deployed, so these items will not be retried: make the run red
    // (GitHub mails the owner) instead of finishing green.
    console.error(`::error::${failed} 則推播沒有送出（原因在上面）。這一輪的內容已經記成看過，不會自動重送。`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(`推播失敗：${e && e.message}`);
  process.exitCode = 1;
});
