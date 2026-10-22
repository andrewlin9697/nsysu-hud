'use strict';
// fetch with timeout and retries (network errors, 5xx and 429 are retried twice by default).

const UA = 'Mozilla/5.0 (compatible; nsysu-hud/1.0; +https://github.com/andrewlin9697/nsysu-hud)';

const defaultSleep = (ms) => new Promise((r) => setTimeout(r, ms));

class HttpError extends Error {
  constructor(status, url) {
    super(`HTTP ${status}`);
    this.status = status;
    this.url = url;
  }
}

async function fetchWithRetry(url, init = {}, opts = {}) {
  const fetchImpl = opts.fetch || globalThis.fetch;
  const retries = opts.retries == null ? 2 : opts.retries;
  const timeoutMs = opts.timeoutMs || 20000;
  const sleep = opts.sleep || defaultSleep;
  const backoff = opts.backoffMs == null ? 2000 : opts.backoffMs;
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const signal = typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : undefined;
      const res = await fetchImpl(url, {
        ...init,
        headers: { 'User-Agent': UA, 'Accept-Language': 'zh-TW,zh;q=0.9', ...(init.headers || {}) },
        signal,
      });
      if (res.status >= 500 || res.status === 429) throw new HttpError(res.status, url);
      return res;
    } catch (e) {
      lastErr = e;
      if (attempt < retries) await sleep(backoff * 2 ** attempt);
    }
  }
  throw lastErr;
}

// Short, log-safe error text (never includes request bodies).
function errorText(e) {
  if (!e) return '未知錯誤';
  if (e instanceof HttpError) return e.message;
  if (e.name === 'TimeoutError' || e.name === 'AbortError') return '連線逾時';
  const cause = e.cause && (e.cause.code || e.cause.message);
  return cause ? `${e.message}（${cause}）` : e.message || String(e);
}

async function getText(url, opts = {}) {
  const res = await fetchWithRetry(url, {}, opts);
  if (!res.ok) throw new HttpError(res.status, url);
  return res.text();
}

async function getJson(url, opts = {}) {
  const res = await fetchWithRetry(url, { headers: { Accept: 'application/json' } }, opts);
  if (!res.ok) throw new HttpError(res.status, url);
  return res.json();
}

module.exports = { UA, HttpError, fetchWithRetry, errorText, getText, getJson };
