'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/widget/countdown');
const T = require('../src/lib/time');
const { tp, readJson } = require('./helpers');

const fixture = readJson('fixtures/calendar-events.json').events;
const raw = fixture.map((e) => ({ ...e, calendar: '個人' }));

test('classifies the real calendar titles by keyword', () => {
  const kinds = Object.fromEntries(fixture.map((e) => [e.title, C.classifyTitle(e.title).kind]));
  assert.equal(kinds['考試：BESTEP 說寫場'], 'exam');
  assert.equal(kinds['留意公告:計算機概論/計算機程式 期中考(第8週)'], 'exam');
  assert.equal(kinds['報名 116 學測（英文）'], 'deadline');
  assert.equal(kinds['期中考:普通物理（一）PHY102E'], 'exam');
  assert.equal(kinds['⚠️ 學測報名 11/10 截止（還沒報的話快報）'], 'deadline');
  assert.equal(kinds['普物助教課 複習+小考4'], 'exam');
  assert.equal(C.classifyTitle('社團聚餐').kind, null);
  assert.equal(C.classifyTitle('HW3 due').kind, 'deadline');
  assert.equal(C.classifyTitle('Midterm Exam').kind, 'exam');
  assert.equal(C.classifyTitle('residue chemistry').kind, null); // "due" only as a word
});

test('"留意公告:" means the date is not certain', () => {
  const c = C.classifyTitle('留意公告:數位系統設計 期中考(第10週)');
  assert.equal(c.uncertain, true);
  assert.equal(c.display, '數位系統設計 期中考(第10週)');
  const items = C.countdownItems(raw, tp('2026-10-22 08:00'));
  const u = items.find((e) => e.uncertain);
  assert.equal(u.color, 'gray');
  assert.ok(u.label.startsWith('約 '));
});

test('all-day events end at 00:00 the next day', () => {
  const e = C.normalizeEvent({ title: '考試', allDay: true, start: '2026-10-24', end: '2026-10-25' });
  assert.equal(e.lastKey, '2026-10-24');
  const items = (now) => C.countdownItems([{ title: '考試：BESTEP 說寫場', allDay: true, start: '2026-10-24', end: '2026-10-25' }], tp(now));
  assert.equal(items('2026-10-24 23:59')[0].label, '今天');
  assert.equal(items('2026-10-25 00:00').length, 0);
  // Some calendars use 23:59:59 for the end instead
  const e2 = C.normalizeEvent({ title: '考試', allDay: true, start: tp('2026-10-24'), end: new Date(tp('2026-10-25').getTime() - 1000) });
  assert.equal(e2.lastKey, '2026-10-24');
});

test('labels: 今天 19:00, 明天, D-n, and urgency colours', () => {
  const now = tp('2026-11-02 08:00');
  const items = C.countdownItems(raw, now);
  const calc = items.find((e) => e.title.includes('微積分'));
  assert.equal(calc.label, '今天 19:00');
  assert.equal(calc.color, 'red');
  const later = C.countdownItems(raw, tp('2026-11-01 22:00')).find((e) => e.title.includes('微積分'));
  assert.equal(later.label, '明天 19:00');
  const d = C.countdownItems(raw, tp('2026-10-22 08:00'));
  const phy = d.find((e) => e.title.includes('PHY102E'));
  assert.equal(phy.label, 'D-8');
  assert.equal(phy.color, 'secondary');
  const bestep = d.find((e) => e.title.includes('BESTEP'));
  assert.equal(bestep.label, 'D-2');
  assert.equal(bestep.color, 'red');
  const reg = d.find((e) => e.title.startsWith('報名'));
  assert.equal(reg.label, 'D-5');
  assert.equal(reg.color, 'orange');
});

test('crossing midnight changes 明天 into 今天', () => {
  const ev = [{ title: '期中考:微積分（一）EE1003B', allDay: false, start: '2026-11-02T19:00:00+08:00', end: '2026-11-02T21:00:00+08:00' }];
  assert.equal(C.countdownItems(ev, tp('2026-11-01 23:59'))[0].label, '明天 19:00');
  assert.equal(C.countdownItems(ev, tp('2026-11-02 00:01'))[0].label, '今天 19:00');
  assert.equal(C.countdownItems(ev, tp('2026-11-02 19:30'))[0].label, '進行中');
  assert.equal(C.countdownItems(ev, tp('2026-11-02 21:00')).length, 0);
});

test('exam alerts: confirmed exams within 48 hours only', () => {
  const at = (s) => C.examAlerts(C.countdownItems(raw, tp(s)), tp(s)).map((e) => e.display);
  assert.deepEqual(at('2026-10-22 00:00'), ['考試：BESTEP 說寫場']); // starts 10/24 00:00, exactly 48h
  assert.deepEqual(at('2026-10-21 23:59'), []);
  assert.deepEqual(at('2026-10-24 12:00'), ['考試：BESTEP 說寫場']); // all day, in progress
  // the uncertain 10/25 exam never triggers the red alert
  assert.ok(!at('2026-10-24 12:00').some((t) => t.includes('計算機概論')));
});

test('holiday calendars are skipped', () => {
  const items = C.countdownItems([{ title: '期末考週', allDay: true, start: '2026-12-21', end: '2026-12-22', calendar: '台灣節日' }], tp('2026-12-20 10:00'));
  assert.equal(items.length, 0);
  assert.equal(C.isSkippedCalendar('Taiwan Holidays'), true);
  assert.equal(C.isSkippedCalendar('個人'), false);
});

test('examsInWeek returns the Monday–Sunday week', () => {
  const items = C.countdownItems(raw, tp('2026-10-27 08:00'));
  const week = C.examsInWeek(items, '2026-10-28').map((e) => T.md(e.startKey));
  assert.deepEqual(week, ['10/30']);
});
