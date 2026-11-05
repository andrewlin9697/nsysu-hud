'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../src/widget/activities-view');
const { tp } = require('./helpers');

const feed = {
  types: { english_table: { name: 'English Table' }, job_talk: { name: 'Job Talk' } },
  events: [
    { id: 1, type: 'english_table', date: '2026-11-05', start: '12:10', end: '12:55', location: '圖資大樓', avail: 3, openAt: '2026-11-04T04:00:00.000Z' },
    { id: 2, type: 'job_talk', date: '2026-11-05', start: '16:00', avail: 10, conflict: '普物' },
    { id: 3, type: 'english_table', date: '2026-11-06', start: '12:10', avail: 0, openAt: '2026-11-05T04:00:00.000Z' },
    { id: 4, type: 'english_table', date: '2026-11-06', start: '16:10', avail: 40, openAt: '2026-11-05T04:00:00.000Z' },
    { id: 5, type: 'unknown_type', date: 'bad', start: '12:10' },
  ],
};

test('upcoming sessions skip past and malformed ones, names come from types', () => {
  const list = A.upcomingSessions(feed, tp('2026-11-05 13:00'));
  assert.deepEqual(list.map((s) => s.id), [2, 3, 4]);
  assert.equal(list[0].name, 'Job Talk');
  assert.deepEqual(A.upcomingSessions(null, tp('2026-11-05 13:00')), []);
  assert.deepEqual(A.upcomingSessions({ events: 'x' }, tp('2026-11-05 13:00')), []);
});

test('only sessions without a class clash and not full are suggested', () => {
  assert.equal(A.sessionOn(feed, tp('2026-11-05 10:00'), '2026-11-05').id, 1);
  assert.equal(A.sessionOn(feed, tp('2026-11-05 13:00'), '2026-11-05'), null); // 16:00 clashes with 普物
  assert.equal(A.sessionOn(feed, tp('2026-11-05 20:00'), '2026-11-06').id, 4); // 12:10 is full
  assert.equal(A.spotsText({ avail: 0 }), '額滿');
  assert.equal(A.spotsText({ avail: 3 }), '剩 3 位');
});

test('booking that opens within 24 hours', () => {
  const o = A.nextOpening(feed, tp('2026-11-04 20:00'));
  assert.equal(o.id, 3);
  assert.equal(o.openAt.toISOString(), '2026-11-05T04:00:00.000Z');
  assert.equal(A.nextOpening(feed, tp('2026-11-05 12:30')), null);
});
