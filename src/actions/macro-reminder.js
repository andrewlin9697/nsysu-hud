'use strict';
// Evening reminder for US macro events between now and 06:00 the next morning.

const M = require('../lib/macro');
const T = require('../lib/time');

function macroPayload(config, now) {
  const events = M.tonight(config, now);
  if (!events.length) return null;
  return {
    title: events.length === 1 ? '今晚美股大事' : `今晚美股大事 ${events.length} 件`,
    message: events.map((e) => M.reminderLine(e, now)).join('\n'),
    tags: ['chart_with_upwards_trend'],
    priority: 3,
  };
}

const EXPIRY_WARN_DAYS = 30;

// config/macro-events.json is a hand-kept list that simply runs out (the last entry is checked,
// not today's news). Once a week (Mondays, Taipei) while the last event is less than
// EXPIRY_WARN_DAYS away — or already past — remind the owner to extend it, instead of going
// quiet forever with the same "nothing tonight" log as a normal day.
function expiryPayload(config, now) {
  const events = M.normalizeEvents(config);
  if (T.parts(now).weekday !== 1) return null;
  if (!events.length) {
    return { title: '美股大事清單是空的', message: '請更新 config/macro-events.json，不然不會再有美股提醒。', tags: ['calendar'], priority: 3 };
  }
  const last = events[events.length - 1];
  const lastKey = T.dateKey(last.time);
  const days = T.diffDays(T.dateKey(now), lastKey); // days from today to the last event
  if (days >= EXPIRY_WARN_DAYS) return null;
  return {
    title: days < 0 ? '美股大事清單用完了' : '美股大事清單快用完了',
    message: days < 0
      ? `最後一筆是 ${T.md(lastKey)}，已經過了。請更新 config/macro-events.json，不然不會再有美股提醒。`
      : `清單只排到 ${T.md(lastKey)}（還有 ${days} 天）。請更新 config/macro-events.json。`,
    tags: ['calendar'],
    priority: 3,
  };
}

module.exports = { EXPIRY_WARN_DAYS, macroPayload, expiryPayload };
