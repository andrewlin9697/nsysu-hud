'use strict';
// Evening reminder for US macro events between now and 06:00 the next morning.

const M = require('../lib/macro');

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

module.exports = { macroPayload };
