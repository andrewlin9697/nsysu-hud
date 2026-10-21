'use strict';
// Reads the JSON currently published on GitHub Pages (our only state store).

const { fetchWithRetry, errorText } = require('./http');

const DEFAULT_PAGES_BASE = 'https://andrewlin9697.github.io/nsysu-hud';
const DATA_FILES = ['notices.json', 'youbike.json', 'course-state.json'];

// → { status: 'ok', data } | { status: 'missing' } (404: first run) | { status: 'error', error }
async function fetchPrevious(base, file, opts = {}) {
  const url = `${base.replace(/\/$/, '')}/data/${file}?t=${Date.now()}`;
  try {
    const res = await fetchWithRetry(url, { headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' } }, opts);
    if (res.status === 404) return { status: 'missing' };
    if (!res.ok) return { status: 'error', error: `HTTP ${res.status}` };
    const text = await res.text();
    try {
      return { status: 'ok', data: JSON.parse(text) };
    } catch (e) {
      return { status: 'error', error: `JSON 格式錯誤：${e.message}` };
    }
  } catch (e) {
    return { status: 'error', error: errorText(e) };
  }
}

module.exports = { DEFAULT_PAGES_BASE, DATA_FILES, fetchPrevious };
