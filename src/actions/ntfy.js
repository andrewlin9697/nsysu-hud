'use strict';
// ntfy push via JSON publishing (so Chinese titles survive). The topic comes from the NTFY_TOPIC
// secret and is never printed: logs only ever show the payload without it.

const { fetchWithRetry, errorText } = require('./http');

const NTFY_URL = 'https://ntfy.sh/';

function buildRequest(payload, topic) {
  const body = { topic, ...payload };
  for (const k of Object.keys(body)) if (body[k] == null || body[k] === '') delete body[k];
  return {
    url: NTFY_URL,
    init: { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) },
  };
}

function describe(payload) {
  const { title, message, click, tags, priority } = payload;
  return JSON.stringify({ title, message, click, tags, priority }, null, 2);
}

async function sendNtfy(payload, opts = {}) {
  const log = opts.log || console.log;
  if (!payload) return { sent: false, reason: 'empty' };
  if (opts.dryRun) {
    log(`[DRY_RUN] 不推播，內容如下（不含主題名稱）：\n${describe(payload)}`);
    return { sent: false, reason: 'dry-run' };
  }
  const topic = opts.topic;
  if (!topic) {
    log('沒有設定 NTFY_TOPIC，略過推播。');
    return { sent: false, reason: 'no-topic' };
  }
  const req = buildRequest(payload, topic);
  try {
    const res = await fetchWithRetry(req.url, req.init, { fetch: opts.fetch, sleep: opts.sleep, retries: 2 });
    if (!res.ok) {
      log(`推播失敗：HTTP ${res.status}`);
      return { sent: false, reason: `HTTP ${res.status}` };
    }
    log(`已推播：${payload.title}`);
    return { sent: true };
  } catch (e) {
    log(`推播失敗：${errorText(e)}`);
    return { sent: false, reason: errorText(e) };
  }
}

module.exports = { NTFY_URL, buildRequest, sendNtfy, describe };
