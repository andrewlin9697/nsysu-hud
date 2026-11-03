'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildRequest, sendNtfy } = require('../src/actions/ntfy');

const TOPIC = 'secret-topic-do-not-print';
const payload = { title: '中山公告 1 則', message: '【電機系】測試', click: 'https://web.ee.nsysu.edu.tw/', tags: ['loudspeaker'], priority: 3 };

test('JSON publishing to https://ntfy.sh/ with the topic in the body', () => {
  const req = buildRequest({ ...payload, click: undefined }, TOPIC);
  assert.equal(req.url, 'https://ntfy.sh/');
  assert.equal(req.init.method, 'POST');
  assert.match(req.init.headers['Content-Type'], /application\/json/);
  const body = JSON.parse(req.init.body);
  assert.deepEqual(body, { topic: TOPIC, title: '中山公告 1 則', message: '【電機系】測試', tags: ['loudspeaker'], priority: 3 });
});

test('sends once, never logs the topic', async () => {
  const logs = [];
  const calls = [];
  const fetch = async (url, init) => { calls.push({ url, init }); return { ok: true, status: 200 }; };
  const r = await sendNtfy(payload, { topic: TOPIC, fetch, log: (m) => logs.push(m) });
  assert.equal(r.sent, true);
  assert.equal(calls.length, 1);
  assert.equal(JSON.parse(calls[0].init.body).topic, TOPIC);
  assert.ok(!logs.join('\n').includes(TOPIC));
});

test('DRY_RUN prints the payload without the topic and does not send', async () => {
  const logs = [];
  let called = false;
  const r = await sendNtfy(payload, { topic: TOPIC, dryRun: true, fetch: async () => { called = true; }, log: (m) => logs.push(m) });
  assert.equal(r.reason, 'dry-run');
  assert.equal(called, false);
  assert.match(logs.join('\n'), /中山公告 1 則/);
  assert.ok(!logs.join('\n').includes(TOPIC));
});

test('missing topic is skipped; server errors retry twice then give up quietly', async () => {
  assert.equal((await sendNtfy(payload, { log: () => {} })).reason, 'no-topic');
  let n = 0;
  const logs = [];
  const r = await sendNtfy(payload, { topic: TOPIC, fetch: async () => { n++; return { ok: false, status: 502 }; }, sleep: async () => {}, log: (m) => logs.push(m) });
  assert.equal(n, 3);
  assert.equal(r.sent, false);
  assert.ok(!logs.join('\n').includes(TOPIC));
});

test('scheduled push: delay and sequence_id go in the JSON body; logs show the delivery time, not the topic', async () => {
  const { describe } = require('../src/actions/ntfy');
  const scheduled = { ...payload, delay: String(Date.parse('2026-10-28T11:55:00+08:00') / 1000), sequence_id: 'eears-open-20261028-1200' };
  const body = JSON.parse(buildRequest(scheduled, TOPIC).init.body);
  assert.equal(body.delay, scheduled.delay);
  assert.equal(body.sequence_id, 'eears-open-20261028-1200');
  assert.match(describe(scheduled), /"deliverAt": "10\/28（三）11:55（台北時間）"/);
  const logs = [];
  await sendNtfy(scheduled, { topic: TOPIC, fetch: async () => ({ ok: true, status: 200 }), log: (m) => logs.push(m) });
  assert.deepEqual(logs, ['已排程：中山公告 1 則（10/28（三）11:55 送到手機）']);
});

test('cancelNtfy deletes the pending message by sequence ID without printing the topic', async () => {
  const { cancelNtfy } = require('../src/actions/ntfy');
  const calls = [];
  const logs = [];
  const r = await cancelNtfy('eears-open-20261028-1200', { topic: TOPIC, fetch: async (url, init) => { calls.push({ url, init }); return { ok: true, status: 200 }; }, log: (m) => logs.push(m) });
  assert.equal(r.sent, true);
  assert.equal(calls[0].url, `https://ntfy.sh/${TOPIC}/eears-open-20261028-1200`);
  assert.equal(calls[0].init.method, 'DELETE');
  assert.ok(!logs.join('\n').includes(TOPIC));
  assert.equal((await cancelNtfy('bad id!', { topic: TOPIC })).reason, 'bad-id');
  assert.equal((await cancelNtfy('eears-open-20261028-1200', { topic: TOPIC, dryRun: true, log: () => {} })).reason, 'dry-run');
});
