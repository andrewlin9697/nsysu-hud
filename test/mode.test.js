'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { selectMode, nextBoundary } = require('../src/widget/mode');
const { tp, configs } = require('./helpers');

const { courses, semester } = configs();
const mode = (s) => selectMode(tp(s), courses, semester).mode;

test('weekday morning 06:00–09:10', () => {
  assert.equal(mode('2026-10-22 05:59'), 'latenight');
  assert.equal(mode('2026-10-22 06:00'), 'morning');
  assert.equal(mode('2026-10-22 09:09'), 'morning');
});

test('class day 09:10 onwards while classes run', () => {
  assert.equal(mode('2026-10-26 09:10'), 'classday'); // Monday 234 + 567
  assert.equal(mode('2026-10-26 12:30'), 'classday');
  assert.equal(mode('2026-10-26 14:00'), 'classday'); // 567 still running after 13:30
  assert.equal(mode('2026-10-26 15:59'), 'classday');
  assert.equal(mode('2026-10-26 16:00'), 'afternoon'); // after the last class
});

test('afternoon on a day whose classes ended before 13:30', () => {
  assert.equal(mode('2026-10-21 12:30'), 'classday'); // Wednesday: 234 only, still before 13:30
  assert.equal(mode('2026-10-21 13:29'), 'classday');
  assert.equal(mode('2026-10-21 13:30'), 'afternoon');
  assert.equal(mode('2026-10-21 17:59'), 'afternoon');
});

test('evening and late night apply every day, across midnight', () => {
  assert.equal(mode('2026-10-21 18:00'), 'evening');
  assert.equal(mode('2026-10-21 23:59'), 'evening');
  assert.equal(mode('2026-10-22 00:00'), 'latenight');
  assert.equal(mode('2026-10-24 20:00'), 'evening'); // Saturday evening
  assert.equal(mode('2026-10-25 02:00'), 'latenight'); // Sunday night
});

test('holiday mode: weekends, no-class days, winter break, before semester', () => {
  assert.equal(mode('2026-10-24 10:00'), 'holiday'); // Saturday
  assert.equal(mode('2026-10-09 07:00'), 'holiday'); // 國慶紀念日補假 (Friday)
  assert.equal(mode('2026-12-25 10:00'), 'holiday'); // 行憲紀念日
  assert.equal(mode('2027-01-05 10:00'), 'holiday'); // winter break weekday
  assert.equal(mode('2026-09-01 10:00'), 'holiday'); // before classes start
  assert.equal(selectMode(tp('2026-10-09 07:00'), courses, semester).reason, '國慶紀念日補假');
});

test('exam week weekdays still follow the timetable (layout swaps in the exam list)', () => {
  const m = selectMode(tp('2026-10-29 10:00'), courses, semester);
  assert.equal(m.mode, 'classday');
  assert.equal(m.day.exam.kind, 'midterm');
});

test('nextBoundary points at the next class start/end or mode change', () => {
  assert.equal(nextBoundary(tp('2026-10-26 08:00'), courses, semester).toISOString(), tp('2026-10-26 09:10').toISOString());
  assert.equal(nextBoundary(tp('2026-10-26 12:05'), courses, semester).toISOString(), tp('2026-10-26 13:10').toISOString());
  assert.equal(nextBoundary(tp('2026-10-26 23:00'), courses, semester).toISOString(), tp('2026-10-27 00:00').toISOString());
});
