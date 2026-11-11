#!/usr/bin/env node
'use strict';
// GitHub Actions entry: push tonight's US macro events (now → next 06:00 Taipei).
// Env: NTFY_TOPIC (secret, never printed), DRY_RUN=true to only print, NOW=ISO time for testing.

const fs = require('fs');
const path = require('path');
const { macroPayload, expiryPayload } = require('../src/actions/macro-reminder');
const { sendAll } = require('../src/actions/ntfy');

async function main() {
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'macro-events.json'), 'utf8'));
  const now = process.env.NOW ? new Date(process.env.NOW) : new Date();
  if (Number.isNaN(now.getTime())) throw new Error(`NOW 不是合法的時間：${process.env.NOW}`);
  const pushes = [];
  const payload = macroPayload(config, now);
  if (payload) {
    console.log(`今晚的美股大事：\n${payload.message}`);
    pushes.push({ kind: 'macro', payload });
  } else {
    console.log('今晚到明早 06:00 沒有美股大事，不推播。');
  }
  const expiry = expiryPayload(config, now);
  if (expiry) {
    console.log(`${expiry.title}：${expiry.message}`);
    pushes.push({ kind: 'macro-expiry', payload: expiry });
  }
  if (!pushes.length) return;
  const dryRun = /^(1|true|yes)$/i.test(process.env.DRY_RUN || '');
  const { failed } = await sendAll(pushes, { topic: process.env.NTFY_TOPIC, dryRun });
  if (failed) {
    console.error(`::error::${failed} 則推播沒有送出（原因在上面）。`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(`美股提醒失敗：${e && e.message}`);
  process.exitCode = 1;
});
