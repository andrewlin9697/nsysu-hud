'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../src/actions/activities');
const { tp, readJson, configs } = require('./helpers');

const { courses, semester } = configs();
const cfg = readJson('config/activities.json');
const TYPES = readJson('fixtures/eears-event-types.json');
const EVENTS = readJson('fixtures/eears-events.json');
const rules = Object.fromEntries(TYPES.data.map((t) => [t.code, t.openRule]));

const plan = (prev, now, events = EVENTS, extra = {}) =>
  A.planActivities(prev, TYPES, events, { now, cfg: { ...cfg, ...extra }, courses, semester });
const kinds = (r) => r.pushes.map((p) => p.kind);
const unix = (s) => String(Math.floor(tp(s).getTime() / 1000));
const withEvent = (id, patch) => EVENTS.map((e) => (e.id === id ? { ...e, ...patch } : e));

test('opening rules from /api/event-types (English Club checked against the site: 11/4 → 10/28 12:00)', () => {
  assert.equal(A.openDateKey('2026-11-02', rules.english_table), '2026-11-01');
  assert.equal(A.openDateKey('2026-11-02', rules.job_talk), '2026-10-26');
  assert.equal(A.openDateKey('2026-11-04', rules.english_club), '2026-10-28');
  assert.equal(A.openDateKey('2026-11-05', rules.english_club), '2026-11-04'); // a Thursday session: the day before
  assert.equal(A.openAt('2026-11-04', rules.english_club).toISOString(), tp('2026-10-28 12:00').toISOString());
  assert.equal(A.openDateKey('2026-11-02', { type: 'lottery', hour: 9 }), null);
});

test('class clash: overlap is a conflict, a class ending < 10 minutes before is tight', () => {
  // Monday: 英語化學 13:10–16:00
  assert.deepEqual(A.classClash('2026-11-02', 16 * 60, 17 * 60, courses, semester).tight, { course: '英語化學', start: '13:10', end: '16:00' });
  assert.equal(A.classClash('2026-11-02', 16 * 60 + 10, 17 * 60, courses, semester).tight, null);
  assert.equal(A.classClash('2026-11-02', 14 * 60, 15 * 60, courses, semester).conflict.course, '英語化學');
  assert.deepEqual(A.classClash('2026-10-25', 14 * 60, 15 * 60, courses, semester), { conflict: null, tight: null }); // 光復節
});

test('first run on Mon 10/26 10:00: reminders for the next 70 hours are scheduled at 11:55, no other pushes', () => {
  const r = plan(null, tp('2026-10-26 10:00'));
  assert.deepEqual(kinds(r), ['activities-open', 'activities-open']);
  const [mon, wed] = r.pushes.map((p) => p.payload);

  assert.equal(mon.title, '12:00 開放預約：Job Talk');
  assert.equal(mon.delay, unix('2026-10-26 11:55'));
  assert.equal(mon.sequence_id, 'eears-open-20261026-1200');
  assert.equal(mon.priority, 4);
  assert.equal(mon.click, 'https://emieears-siwan.nsysu.edu.tw/events');
  assert.equal(mon.message, [
    '11/2（一）16:00–17:00 Job Talk・中山貨櫃創業基地 1樓－角落討論室',
    '　⚠︎ 英語化學 16:00 下課，注意別遲到',
    '11/2（一）17:00–18:00 Job Talk・中山貨櫃創業基地 1樓－角落討論室',
    '5 分鐘後開放，點開直接到預約頁',
  ].join('\n'));

  assert.equal(wed.title, '12:00 開放預約：English Club、Job Talk');
  assert.equal(wed.delay, unix('2026-10-28 11:55'));
  assert.match(wed.message, /^11\/4（三）12:00–13:00 English Club・TED教室\(SW1008\)\n　⚠︎ 計概 12:00 下課，注意別遲到\n/);

  assert.equal(r.state.firstRun, true);
  assert.deepEqual(Object.keys(r.state.scheduled), ['eears-open-20261026-1200', 'eears-open-20261028-1200']);
  assert.equal(r.state.events.find((e) => e.id === 460).openAt, tp('2026-10-28 12:00').toISOString());
  assert.equal(r.state.errors.length, 0);
});

test('English Table opens the day before: Sunday 11/1 12:00 for Monday 11/2', () => {
  const r = plan(null, tp('2026-10-30 18:00'));
  const sun = r.pushes.find((p) => p.payload.sequence_id === 'eears-open-20261101-1200').payload;
  assert.equal(sun.title, '12:00 開放預約：English Table');
  assert.equal(sun.delay, unix('2026-11-01 11:55'));
  assert.match(sun.message, /^11\/2（一）12:10–12:55 English Table・圖資大樓 10樓 西灣廣場\n11\/2（一）16:10–16:55 English Table/);
});

test('later runs do not re-send an unchanged reminder, but do after 12 hours or when it changes', () => {
  const first = plan(null, tp('2026-10-26 10:00'));
  assert.equal(plan(first.state, tp('2026-10-26 10:10')).pushes.length, 0);

  const later = plan(first.state, tp('2026-10-26 22:05'));
  assert.deepEqual(later.pushes.map((p) => p.payload.sequence_id), ['eears-open-20261028-1200']); // 10/26 has passed

  const moved = plan(first.state, tp('2026-10-26 10:10'), withEvent(474, { location: '圖資大樓 10樓 西灣廣場' }));
  assert.deepEqual(moved.pushes.map((p) => p.payload.sequence_id), ['eears-open-20261028-1200']);
  assert.match(moved.pushes[0].payload.message, /16:00–17:00 Job Talk・圖資大樓 10樓 西灣廣場/);
});

test('a reminder about to fire is left alone, and kept for a day after it fired', () => {
  const first = plan(null, tp('2026-10-26 10:00'));
  const near = plan(first.state, tp('2026-10-26 11:54'));
  assert.equal(near.pushes.length, 0);
  assert.ok(near.state.scheduled['eears-open-20261026-1200']);
  const after = plan(near.state, tp('2026-10-26 12:30'));
  assert.equal(after.pushes.length, 0);
  assert.ok(after.state.scheduled['eears-open-20261026-1200']);
});

test('sessions removed before their opening → the pending reminder is cancelled', () => {
  const first = plan(null, tp('2026-10-26 10:00'));
  const r = plan(first.state, tp('2026-10-26 10:10'), EVENTS.filter((e) => ![473, 492].includes(e.id)));
  assert.deepEqual(r.pushes, [{ kind: 'activities-cancel', cancel: 'eears-open-20261026-1200' }]);
  assert.equal(r.state.scheduled['eears-open-20261026-1200'], undefined);
});

test('new sessions are pushed after the first run, with when they open', () => {
  const first = plan(null, tp('2026-10-26 10:00'));
  const extra = { ...EVENTS.find((e) => e.id === 473), id: 999, date: '2026-11-16', availableSpots: 10 };
  const r = plan(first.state, tp('2026-10-26 10:10'), [...EVENTS, extra]);
  assert.deepEqual(kinds(r), ['activities-new']);
  assert.equal(r.pushes[0].payload.title, 'EEARS 新增場次：Job Talk');
  assert.equal(r.pushes[0].payload.message, '11/16（一）16:00–17:00 Job Talk　11/9 12:00 開放\n　⚠︎ 英語化學 16:00 下課，注意別遲到');
  assert.equal(plan(r.state, tp('2026-10-26 10:20'), [...EVENTS, extra]).pushes.length, 0);
});

test('a full session that frees up a spot is pushed once', () => {
  const full = withEvent(473, { availableSpots: 0 });
  const a = plan(null, tp('2026-10-26 12:30'), full);
  const b = plan(a.state, tp('2026-10-26 12:40'), withEvent(473, { availableSpots: 1 }));
  assert.deepEqual(kinds(b), ['activities-freed']);
  assert.equal(b.pushes[0].payload.title, '有空位了：Job Talk 11/2 16:00');
  assert.match(b.pushes[0].payload.message, /11\/2（一）16:00–17:00 Job Talk　剩 1 位/);
  const c = plan(b.state, tp('2026-10-26 12:50'), full);
  const d = plan(c.state, tp('2026-10-26 13:00'), withEvent(473, { availableSpots: 2 }));
  assert.equal(d.pushes.length, 0);
});

test('no freed-spot push before booking opens or after the 2-hour cutoff', () => {
  const full = withEvent(375, { availableSpots: 0 }); // English Table 11/3 12:10, opens 11/2 12:00
  const a = plan(null, tp('2026-11-02 11:00'), full);
  assert.equal(plan(a.state, tp('2026-11-02 11:10'), withEvent(375, { availableSpots: 3 })).pushes.filter((p) => p.kind === 'activities-freed').length, 0);
  const b = plan(null, tp('2026-11-03 10:20'), full);
  assert.equal(plan(b.state, tp('2026-11-03 10:30'), withEvent(375, { availableSpots: 3 })).pushes.length, 0);
});

test('sessions clashing with a class are skipped; switching a type off in config skips it too', () => {
  const clash = { ...EVENTS.find((e) => e.id === 473), id: 998, startTime: '14:00', endTime: '15:00' };
  const r = plan(null, tp('2026-10-26 10:00'), [...EVENTS.filter((e) => e.eventType !== 'job_talk' || e.date !== '2026-11-02'), clash]);
  assert.equal(r.pushes.find((p) => p.payload.sequence_id === 'eears-open-20261026-1200'), undefined);
  assert.equal(r.state.events.find((e) => e.id === 998).conflict, '英語化學');
  const noJt = plan(null, tp('2026-10-26 10:00'), EVENTS, { types: ['english_table', 'english_club'] });
  assert.deepEqual(noJt.pushes.map((p) => p.payload.title), ['12:00 開放預約：English Club']);
});

test('an unknown custom rule falls back to the type rule and is reported', () => {
  const r = plan(null, tp('2026-10-26 10:00'), withEvent(460, { customReservationRule: 'first come first served' }));
  assert.equal(r.state.events.find((e) => e.id === 460).openAt, tp('2026-10-28 12:00').toISOString());
  assert.deepEqual(r.state.errors.map((e) => e.source), ['event:460']);
  const custom = plan(null, tp('2026-10-26 10:00'), withEvent(460, { customReservationRule: { type: 'days_before', days: 2, hour: 9, minute: 30 } }));
  assert.equal(custom.state.events.find((e) => e.id === 460).openAt, tp('2026-11-02 09:30').toISOString());
});

test('state keeps only sessions from the last day onwards', () => {
  const r = plan(null, tp('2026-10-26 10:00'));
  assert.ok(r.state.events.every((e) => e.date >= '2026-10-25'));
  assert.equal(r.state.events.length, EVENTS.filter((e) => e.date >= '2026-11-02').length);
});
