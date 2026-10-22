'use strict';
// Shared test helpers (not a test file itself).

const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const readText = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

// Taipei time literal → Date, e.g. tp('2026-10-26 09:10')
function tp(s) {
  const iso = s.length === 10 ? `${s}T00:00:00+08:00` : `${s.replace(' ', 'T')}${s.length === 16 ? ':00' : ''}+08:00`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) throw new Error(`bad time ${s}`);
  return d;
}

const configs = () => ({
  courses: readJson('config/courses.json'),
  semester: readJson('config/semester.json'),
  location: readJson('config/location.json'),
  watchlist: readJson('config/watchlist.json'),
  macro: readJson('config/macro-events.json'),
  youbike: readJson('config/youbike.json'),
  notices: readJson('config/notices.json'),
});

module.exports = { ROOT, readJson, readText, tp, configs };
