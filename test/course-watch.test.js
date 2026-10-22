'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const CW = require('../src/actions/course-watch');
const { tp, readJson, configs } = require('./helpers');

const sample = readJson('fixtures/course-api-sample.json');
const ids = ['PHY102E'];
const labels = { PHY102E: '普物' };

test('resolveLatest reads version.json', () => {
  assert.equal(CW.resolveLatest({ latest: '20261021_160131', history: {} }), '20261021_160131');
  assert.equal(CW.resolveLatest({ history: { '20261020_010101': 'x', '20261021_160131': 'y' } }), '20261021_160131');
  assert.equal(CW.resolveLatest(null), null);
});

test('first run only records a baseline', () => {
  const { messages, snapshots } = CW.diffCourses(null, sample, ids, labels);
  assert.deepEqual(messages, []);
  assert.deepEqual(snapshots.PHY102E.rooms, ['工EC 3013']);
  assert.equal(snapshots.PHY102E.name, '普通物理（一）');
});

test('room, time and change-field differences become messages', () => {
  const prev = CW.diffCourses(null, sample, ids, labels).snapshots;
  const moved = [{ ...sample[0], room: '五5,6,7(工EC 2011)' }];
  assert.deepEqual(CW.diffCourses(prev, moved, ids, labels).messages, [{ courseId: 'PHY102E', message: '普物教室改到 工EC 2011' }]);
  const retimed = [{ ...sample[0], classTime: ['', '', '', '', '', '', ''].map((x, i) => (i === 3 ? '34' : '')) }];
  assert.deepEqual(CW.diffCourses(prev, retimed, ids, labels).messages.map((m) => m.message), ['普物上課時間改為 週四 3、4 節']);
  const changed = [{ ...sample[0], change: '異動', changeDescription: '教室異動 10/20' }];
  assert.deepEqual(CW.diffCourses(prev, changed, ids, labels).messages.map((m) => m.message), ['普物課程異動（異動：教室異動 10/20）']);
  assert.deepEqual(CW.diffCourses(prev, sample, ids, labels).messages, []);
});

test('a course that disappears is reported once, unless the snapshot is incomplete', () => {
  const prev = CW.diffCourses(null, sample, ids, labels).snapshots;
  const gone = CW.diffCourses(prev, [], ids, labels);
  assert.match(gone.messages[0].message, /^普物在最新課程資料中找不到/);
  assert.deepEqual(CW.diffCourses(gone.snapshots, [], ids, labels).messages, []);
  assert.deepEqual(CW.diffCourses(prev, [], ids, labels, { complete: false }).messages, []);
});

test('push payload uses priority 4 and links to the course outline', () => {
  const p = CW.coursePayload([{ courseId: 'PHY102E', message: '普物教室改到 工EC 2011' }], { PHY102E: 'https://selcrs.nsysu.edu.tw/x' });
  assert.deepEqual(p, { title: '課程異動', message: '普物教室改到 工EC 2011', click: 'https://selcrs.nsysu.edu.tw/x', tags: ['warning'], priority: 4 });
  assert.equal(CW.coursePayload([{ message: 'a' }, { message: 'b' }]).title, '課程異動 2 則');
  assert.equal(CW.coursePayload([]), null);
});

test('daily fallback in the data workflow runs after 09:00 once per day', () => {
  assert.equal(CW.courseDue(null, tp('2026-10-22 08:30')), false);
  assert.equal(CW.courseDue(null, tp('2026-10-22 09:00')), true);
  assert.equal(CW.courseDue({ checkedAt: tp('2026-10-22 08:01').toISOString() }, tp('2026-10-22 12:00')), false);
  assert.equal(CW.courseDue({ checkedAt: tp('2026-10-21 08:01').toISOString() }, tp('2026-10-22 12:00')), true);
});

test('watch list matches config/courses.json', () => {
  const { courses, notices } = configs();
  assert.deepEqual(notices.courseWatch.courseIds.slice().sort(), courses.courses.map((c) => c.id).sort());
});
