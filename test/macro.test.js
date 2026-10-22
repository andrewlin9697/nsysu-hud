'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../src/lib/macro');
const { macroPayload } = require('../src/actions/macro-reminder');
const { tp, configs } = require('./helpers');

const { macro } = configs();

test('next event countdown in Taipei time, 預估 when unconfirmed', () => {
  const now = tp('2026-10-21 12:00');
  const next = M.upcoming(macro, now)[0];
  assert.equal(next.title, '聯準會利率決議');
  const cpi = M.upcoming(macro, tp('2026-10-30 12:00'))[0];
  assert.equal(M.countdownText(cpi, tp('2026-10-21 12:00')), '美國 CPI（10 月） 11/10（二）21:30，還有 20 天');
  const nv = M.upcoming(macro, tp('2026-11-12 12:00'))[0];
  assert.match(M.countdownText(nv, tp('2026-11-12 12:00')), /（預估）$/);
});

test('tonight window: now until 06:00 next morning', () => {
  assert.deepEqual(M.tonight(macro, tp('2026-10-28 20:00')).map((e) => e.type), ['FOMC']);
  assert.deepEqual(M.tonight(macro, tp('2026-10-27 20:00')), []);
  assert.deepEqual(M.tonight(macro, tp('2026-11-10 20:00')).map((e) => e.type), ['CPI']);
  assert.deepEqual(M.tonight(macro, tp('2026-11-18 20:00')).map((e) => e.type), ['EARNINGS']); // 06:00 is included
  assert.deepEqual(M.tonight(macro, tp('2026-11-10 21:45')), []); // already started
  assert.equal(M.tonightEnd(tp('2026-10-29 01:00')).toISOString(), tp('2026-10-29 06:00').toISOString());
});

test('reminder text: 今晚 21:30 / 凌晨 2:00', () => {
  assert.deepEqual(macroPayload(macro, tp('2026-11-10 20:00')), {
    title: '今晚美股大事',
    message: '今晚 21:30 美國 CPI（10 月）',
    tags: ['chart_with_upwards_trend'],
    priority: 3,
  });
  assert.equal(macroPayload(macro, tp('2026-10-28 20:00')).message, '凌晨 2:00 聯準會利率決議');
  assert.equal(macroPayload(macro, tp('2026-11-18 20:00')).message, '清晨 6:00 輝達財報（FY27 Q3）（預估）');
  // 12/10 has both FOMC (03:00) and CPI (21:30 the same day, i.e. not tonight from 12/9)
  assert.equal(macroPayload(macro, tp('2026-12-09 20:00')).message, '凌晨 3:00 聯準會利率決議（含經濟預測）');
  assert.equal(macroPayload(macro, tp('2026-10-27 20:00')), null);
});
