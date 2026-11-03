'use strict';
// ntfy push via JSON publishing (so Chinese titles survive). The topic comes from the NTFY_TOPIC
// secret and is never printed: logs only ever show the payload without it.
//
// Scheduled pushes: `delay` (unix seconds) makes ntfy hold the message and deliver it at that
// time; `sequence_id` lets a later publish with the same ID replace the pending message, and
// cancelNtfy() deletes it before delivery.

const { fetchWithRetry, errorText } = require('./http');
const T = require('../lib/time');

const NTFY_URL = 'https://ntfy.sh/';

function buildRequest(payload, topic) {
  const body = { topic, ...payload };
  for (const k of Object.keys(body)) if (body[k] == null || body[k] === '') delete body[k];
  return {
    url: NTFY_URL,
    init: { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) },
  };
}

// "10/28（三）11:55" for a unix-seconds delay, or null.
function deliveryText(payload) {
  if (!payload || !/^\d+$/.test(String(payload.delay || ''))) return null;
  const at = new Date(Number(payload.delay) * 1000);
  return `${T.mdw(T.dateKey(at))}${T.hm(at)}`;
}

function describe(payload) {
  const { title, message, click, tags, priority } = payload;
  const out = { title, message, click, tags, priority };
  const when = deliveryText(payload);
  if (when) out.deliverAt = `${when}（台北時間）`;
  if (payload.sequence_id) out.sequence_id = payload.sequence_id;
  return JSON.stringify(out, null, 2);
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
    const when = deliveryText(payload);
    log(when ? `已排程：${payload.title}（${when} 送到手機）` : `已推播：${payload.title}`);
    return { sent: true };
  } catch (e) {
    log(`推播失敗：${errorText(e)}`);
    return { sent: false, reason: errorText(e) };
  }
}

// Deletes a scheduled message that has not been delivered yet (DELETE /<topic>/<sequence_id>).
async function cancelNtfy(sequenceId, opts = {}) {
  const log = opts.log || console.log;
  if (!/^[-_A-Za-z0-9]{1,64}$/.test(String(sequenceId || ''))) return { sent: false, reason: 'bad-id' };
  if (opts.dryRun) {
    log(`[DRY_RUN] 不取消，會取消排程中的推播：${sequenceId}`);
    return { sent: false, reason: 'dry-run' };
  }
  if (!opts.topic) {
    log('沒有設定 NTFY_TOPIC，略過取消。');
    return { sent: false, reason: 'no-topic' };
  }
  const url = `${NTFY_URL}${encodeURIComponent(opts.topic)}/${sequenceId}`;
  try {
    const res = await fetchWithRetry(url, { method: 'DELETE' }, { fetch: opts.fetch, sleep: opts.sleep, retries: 2 });
    if (!res.ok && res.status !== 404) {
      log(`取消排程推播失敗：HTTP ${res.status}`);
      return { sent: false, reason: `HTTP ${res.status}` };
    }
    log(`已取消排程推播：${sequenceId}`);
    return { sent: true };
  } catch (e) {
    log(`取消排程推播失敗：${errorText(e)}`);
    return { sent: false, reason: errorText(e) };
  }
}

module.exports = { NTFY_URL, buildRequest, sendNtfy, cancelNtfy, describe };
