'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../src/lib/time');
const { tp } = require('./helpers');

test('Taipei wall clock is independent of the machine time zone', () => {
  const p = T.parts(new Date('2026-10-21T16:30:00Z'));
  assert.equal(p.dateKey, '2026-10-22');
  assert.equal(p.hh, 0);
  assert.equal(p.mm, 30);
  assert.equal(p.weekday, 4); // Thursday
  assert.equal(T.hm(tp('2026-10-22 09:05')), '09:05');
});

test('at / addDays / diffDays / weekStart', () => {
  assert.equal(T.at('2026-10-22', '07:30').toISOString(), '2026-10-21T23:30:00.000Z');
  assert.equal(T.addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(T.addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(T.diffDays('2026-10-21', '2026-11-10'), 20);
  assert.equal(T.weekStart('2026-10-25'), '2026-10-19'); // Sunday belongs to the week starting Monday 10/19
  assert.equal(T.weekStart('2026-10-26'), '2026-10-26');
});

test('parseTime handles offsets, date-only and offset-less local strings as Taipei time', () => {
  assert.equal(T.parseTime('2026-10-24').toISOString(), '2026-10-23T16:00:00.000Z');
  assert.equal(T.parseTime('2026-10-21T13:00').toISOString(), '2026-10-21T05:00:00.000Z');
  assert.equal(T.parseTime('2026-10-22 02:55:33').toISOString(), '2026-10-21T18:55:33.000Z');
  assert.equal(T.parseTime('2026-10-27T09:00:00+08:00').toISOString(), '2026-10-27T01:00:00.000Z');
  assert.equal(T.parseTime(''), null);
  assert.equal(T.parseTime('not a date'), null);
});

test('relDayLabel: tomorrow, later this week, next week', () => {
  assert.equal(T.relDayLabel('2026-10-21', '2026-10-21'), '今天');
  assert.equal(T.relDayLabel('2026-10-21', '2026-10-22'), '明天');
  assert.equal(T.relDayLabel('2026-10-21', '2026-10-23'), '後天');
  assert.equal(T.relDayLabel('2026-10-20', '2026-10-23'), '週五');
  assert.equal(T.relDayLabel('2026-10-23', '2026-10-26'), '下週一'); // Friday → Monday
  assert.equal(T.relDayLabel('2026-10-24', '2026-10-26'), '下週一'); // Saturday → Monday is next week
  assert.equal(T.relDayLabel('2026-10-21', '2026-11-04'), '11/4（三）');
});

test('formatting helpers', () => {
  assert.equal(T.mdw('2026-11-10'), '11/10（二）');
  assert.equal(T.durationText(35), '35 分鐘');
  assert.equal(T.durationText(100), '1 小時 40 分');
  assert.equal(T.durationText(120), '2 小時');
});
