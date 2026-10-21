#!/usr/bin/env node
'use strict';
// GitHub Actions entry: push tonight's US macro events (now → next 06:00 Taipei).
// Env: NTFY_TOPIC (secret, never printed), DRY_RUN=true to only print, NOW=ISO time for testing.

const fs = require('fs');
const path = require('path');
const { sendNtfy } = require('../src/actions/ntfy');
const { macroPayload } = require('../src/actions/macro-reminder');

async function main() {
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'macro-events.json'), 'utf8'));
  const now = process.env.NOW ? new Date(process.env.NOW) : new Date();
  const payload = macroPayload(config, now);
  if (!payload) {
    console.log('今晚到明早 06:00 沒有美股大事，不推播。');
    return;
  }
  console.log(`今晚的美股大事：\n${payload.message}`);
  const dryRun = /^(1|true|yes)$/i.test(process.env.DRY_RUN || '');
  await sendNtfy(payload, { topic: process.env.NTFY_TOPIC, dryRun });
}

main().catch((e) => {
  console.error(`美股提醒失敗：${e && e.message}`);
  process.exitCode = 1;
});
