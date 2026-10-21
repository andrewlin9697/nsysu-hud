'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../src/widget/schedule');
const { tp, configs } = require('./helpers');

const { courses, semester } = configs();

test('consecutive periods merge into one block (234 → 09:10–12:00)', () => {
  const table = S.periodTable(courses.periods);
  assert.deepEqual(table.map((p) => p.key), ['1', '2', '3', '4', 'C', '5', '6', '7', '8', '9']);
  const [b] = S.courseBlocks({ periods: '234' }, table);
  assert.equal(`${b.start}–${b.end}`, '09:10–12:00');
  const split = S.courseBlocks({ periods: '24' }, table);
  assert.deepEqual(split.map((x) => `${x.start}–${x.end}`), ['09:10–10:00', '11:10–12:00']);
  const lunch = S.courseBlocks({ periods: '4C5' }, table);
  assert.deepEqual(lunch.map((x) => `${x.start}–${x.end}`), ['11:10–14:00']);
});

test('in class: remaining minutes, including the last minute', () => {
  const st = S.classStatus(tp('2026-10-26 10:30'), courses, semester);
  assert.equal(st.current.course.id, 'EE1700B');
  assert.equal(st.current.minutesLeft, 90);
  const last = S.classStatus(new Date(tp('2026-10-26 11:59').getTime() + 30000), courses, semester);
  assert.equal(last.current.minutesLeft, 1);
  const ended = S.classStatus(tp('2026-10-26 12:00'), courses, semester);
  assert.equal(ended.current, null);
  assert.equal(ended.inBreak, true);
  assert.equal(ended.nextToday.course.id, 'CHEM115');
  assert.equal(ended.nextToday.minutesUntil, 70);
});

test('no more classes today → tomorrow\'s first class', () => {
  const st = S.classStatus(tp('2026-10-21 13:00'), courses, semester); // Wednesday after 234
  assert.equal(st.doneToday, true);
  assert.equal(st.next.course.id, 'EE1301B');
  assert.equal(st.next.rel, '明天');
  assert.equal(st.next.start, '09:10');
});

test('after Friday\'s last class the next one is next Monday', () => {
  const st = S.classStatus(tp('2026-10-23 16:05'), courses, semester);
  assert.equal(st.next.dateKey, '2026-10-26');
  assert.equal(st.next.rel, '下週一');
  assert.equal(st.next.course.short, '數位設計');
});

test('no-class days are skipped', () => {
  // Thursday 10/8 evening: Friday 10/9 is 國慶紀念日補假 → Monday 10/12
  const st = S.classStatus(tp('2026-10-08 20:00'), courses, semester);
  assert.equal(st.next.dateKey, '2026-10-12');
  assert.deepEqual(S.blocksForDate('2026-10-09', courses, semester), []);
  // winter break → nothing within 30 days
  assert.equal(S.findNextClass(tp('2026-12-28 09:00'), courses, semester), null);
});

test('course-state room changes override the config room', () => {
  const state = { courses: { PHY102E: { room: '五5,6,7(工EC 2011)' }, EE1003B: { room: '五2,3,4(工EC 2011)' } } };
  const out = S.applyCourseState(courses, state);
  const phy = out.courses.find((c) => c.id === 'PHY102E');
  assert.equal(phy.room, '工EC 2011');
  assert.equal(phy.roomChanged, true);
  assert.equal(phy.configRoom, '工EC 3013');
  assert.equal(out.courses.find((c) => c.id === 'EE1003B').roomChanged, undefined);
  assert.deepEqual(S.parseRooms('二3,4(理SC 1001) 四5(工EC 2011)'), ['理SC 1001', '工EC 2011']);
  assert.equal(S.buildingOf('管CM 1019'), 'CM');
});
