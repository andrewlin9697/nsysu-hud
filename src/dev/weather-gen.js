'use strict';
// Deterministic fake Open-Meteo responses (same shape as config/location.json's forecastUrl),
// because the dev environment can't reach api.open-meteo.com. Dev / test only — not bundled.

const T = require('../lib/time');

/**
 * opts.rain:  { 'YYYY-MM-DD': { from: 15, to: 17, pop: 70, mm: 1.2 } }  rainy hours (inclusive)
 * opts.uvPeak: max UV at 12:00 (default 9)
 * opts.baseTemp: daily low (default 23)
 */
function makeForecast(startKey, opts = {}) {
  const days = [startKey, T.addDays(startKey, 1)];
  const uvPeak = opts.uvPeak == null ? 9 : opts.uvPeak;
  const base = opts.baseTemp == null ? 23 : opts.baseTemp;
  const hourly = {
    time: [], temperature_2m: [], apparent_temperature: [], precipitation_probability: [],
    precipitation: [], weather_code: [], uv_index: [], is_day: [],
  };
  for (const key of days) {
    const rain = (opts.rain || {})[key];
    for (let h = 0; h < 24; h++) {
      const wet = rain && h >= rain.from && h <= rain.to;
      const temp = base + 6 * Math.max(0, Math.sin(((h - 6) / 14) * Math.PI));
      const uv = h < 7 || h > 17 ? 0 : Math.max(0, uvPeak * Math.sin(((h - 6) / 12) * Math.PI));
      hourly.time.push(`${key}T${T.pad2(h)}:00`);
      hourly.temperature_2m.push(Math.round(temp * 10) / 10);
      hourly.apparent_temperature.push(Math.round((temp + 2) * 10) / 10);
      hourly.precipitation_probability.push(wet ? rain.pop : 10 + ((h * 7) % 11));
      hourly.precipitation.push(wet ? rain.mm : 0);
      hourly.weather_code.push(wet ? (rain.mm >= 2 ? 65 : 61) : h >= 10 && h <= 15 ? 2 : 1);
      hourly.uv_index.push(Math.round(uv * (wet ? 0.4 : 1) * 100) / 100);
      hourly.is_day.push(h >= 6 && h < 18 ? 1 : 0);
    }
  }
  const sliceDay = (arr, i) => arr.slice(i * 24, i * 24 + 24);
  const nowH = opts.currentHour == null ? 7 : opts.currentHour;
  return {
    latitude: 22.625,
    longitude: 120.25,
    generationtime_ms: 0.1,
    utc_offset_seconds: 28800,
    timezone: 'Asia/Taipei',
    timezone_abbreviation: 'GMT+8',
    elevation: 12,
    current_units: { time: 'iso8601', interval: 'seconds', temperature_2m: '°C', apparent_temperature: '°C', weather_code: 'wmo code', is_day: '' },
    current: {
      time: `${startKey}T${T.pad2(nowH)}:00`,
      interval: 900,
      temperature_2m: hourly.temperature_2m[nowH],
      apparent_temperature: hourly.apparent_temperature[nowH],
      weather_code: hourly.weather_code[nowH],
      is_day: hourly.is_day[nowH],
    },
    hourly_units: { time: 'iso8601', temperature_2m: '°C', apparent_temperature: '°C', precipitation_probability: '%', precipitation: 'mm', weather_code: 'wmo code', uv_index: '', is_day: '' },
    hourly,
    daily_units: { time: 'iso8601', sunrise: 'iso8601', sunset: 'iso8601', uv_index_max: '', precipitation_probability_max: '%', temperature_2m_max: '°C', temperature_2m_min: '°C' },
    daily: {
      time: days,
      sunrise: days.map((k) => `${k}T05:58`),
      sunset: days.map((k) => `${k}T17:24`),
      uv_index_max: days.map((_, i) => Math.max(...sliceDay(hourly.uv_index, i))),
      precipitation_probability_max: days.map((_, i) => Math.max(...sliceDay(hourly.precipitation_probability, i))),
      temperature_2m_max: days.map((_, i) => Math.max(...sliceDay(hourly.temperature_2m, i))),
      temperature_2m_min: days.map((_, i) => Math.min(...sliceDay(hourly.temperature_2m, i))),
    },
  };
}

module.exports = { makeForecast };
