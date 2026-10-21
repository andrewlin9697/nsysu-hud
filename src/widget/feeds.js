'use strict';
// Data published by GitHub Actions on GitHub Pages: notices.json, youbike.json.

const T = require('../lib/time');

const YOUBIKE_STALE_MIN = 30;

// Notices first seen in the last `hours` hours. Baseline / old-dated items are "quiet" and never count as new.
function recentNotices(notices, now, hours = 24) {
  const since = now.getTime() - hours * 3600 * 1000;
  return ((notices && notices.items) || [])
    .filter((n) => !n.quiet && n.firstSeen && T.parseTime(n.firstSeen).getTime() >= since)
    .sort((a, b) => String(b.firstSeen).localeCompare(String(a.firstSeen)) || String(b.date || '').localeCompare(String(a.date || '')));
}

function sortedNotices(notices) {
  return ((notices && notices.items) || [])
    .slice()
    .sort((a, b) => String(b.date || b.firstSeen || '').localeCompare(String(a.date || a.firstSeen || '')) ||
      String(b.firstSeen || '').localeCompare(String(a.firstSeen || '')));
}

function stationMap(youbike) {
  const map = {};
  for (const s of (youbike && youbike.stations) || []) map[s.no] = s;
  return map;
}

// Station data age: the station's own timestamp, falling back to when Actions fetched the feed.
function stationAge(station, feed, now) {
  const t = T.parseTime((station && station.updated) || (feed && feed.updatedAt));
  if (!t) return null;
  return Math.max(0, Math.round((now - t) / 60000));
}

function isStationStale(station, feed, now, maxMin = YOUBIKE_STALE_MIN) {
  const age = stationAge(station, feed, now);
  return age == null || age > maxMin;
}

function stationUpdatedAt(station, feed) {
  return T.parseTime((station && station.updated) || (feed && feed.updatedAt));
}

function stationForBuilding(building, coursesCfg) {
  const map = (coursesCfg && coursesCfg.buildingToYouBike) || {};
  return building && map[building] ? map[building] : null;
}

// Short station label: "中山大學工學院" → "工學院"
function shortStationName(name) {
  return String(name || '').replace(/^中山大學/, '').replace(/^捷運/, '') || name;
}

// Only keep the configured stations from the full station-yb2.json feed (array of ~9700 stations).
function pickStations(feed, stationsCfg) {
  const wanted = new Map((stationsCfg || []).map((s) => [String(s.no), s]));
  const found = new Map();
  for (const st of Array.isArray(feed) ? feed : []) {
    const no = String(st.station_no);
    if (!wanted.has(no)) continue;
    const cfg = wanted.get(no);
    found.set(no, {
      no,
      name: cfg.name || st.name_tw,
      bikes: typeof st.available_spaces === 'number' ? st.available_spaces : null,
      docks: typeof st.empty_spaces === 'number' ? st.empty_spaces : null,
      total: typeof st.parking_spaces === 'number' ? st.parking_spaces : null,
      status: st.status,
      updated: st.updated_at ? toIsoTaipei(st.updated_at) : null,
      favorite: !!cfg.favorite,
    });
  }
  const stations = [];
  const missing = [];
  for (const [no, cfg] of wanted) {
    if (found.has(no)) stations.push(found.get(no));
    else missing.push({ no, name: cfg.name });
  }
  return { stations, missing };
}

// "2026-10-22 02:55:33" (Taipei) → "2026-10-22T02:55:33+08:00"
function toIsoTaipei(s) {
  const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)$/.exec(String(s).trim());
  return m ? `${m[1]}T${m[2].length === 5 ? `${m[2]}:00` : m[2]}+08:00` : String(s);
}

module.exports = {
  YOUBIKE_STALE_MIN,
  recentNotices,
  sortedNotices,
  stationMap,
  stationAge,
  isStationStale,
  stationUpdatedAt,
  stationForBuilding,
  shortStationName,
  pickStations,
  toIsoTaipei,
};
