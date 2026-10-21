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
