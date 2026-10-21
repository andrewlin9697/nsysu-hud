'use strict';
// Build-time snapshot of config/*.json, used only when the phone has never downloaded the configs.

module.exports = {
  courses: require('../../config/courses.json'),
  semester: require('../../config/semester.json'),
  location: require('../../config/location.json'),
  watchlist: require('../../config/watchlist.json'),
  'macro-events': require('../../config/macro-events.json'),
  youbike: require('../../config/youbike.json'),
};
