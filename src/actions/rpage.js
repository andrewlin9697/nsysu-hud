'use strict';
// Parsers for NSYSU "RPage" list pages (see fixtures/rpage-*.html and config/notices.json _note).

const H = require('./html');

function cleanHtml(html) {
  return H.stripComments(html)
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, ' ');
}

function cleanTitle(s) {
  return String(s || '')
    .replace(/[(（]\s*另開新視窗\s*[)）]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Absolute URL without the ?Lang=zh-tw parameter.
function normalizeUrl(href, base) {
  let u;
  try {
    u = new URL(String(href || '').trim(), base);
  } catch (e) {
    return null;
  }
  if (!/^https?:$/.test(u.protocol)) return null;
  u.searchParams.delete('Lang');
  u.hash = '';
  return u.toString();
}

// Article id: second number of /p/40[46]-(\d+)-(\d+); dedupe key is "{hostname}:{id}".
function articleKey(url) {
  let u;
  try {
    u = new URL(url);
  } catch (e) {
    return null;
  }
  const m = /\/p\/40[46]-(\d+)-(\d+)/.exec(u.pathname);
  return m ? `${u.hostname}:${m[2]}` : `${u.hostname}:${u.pathname}`;
}

function normDate(s) {
  const m = /(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/.exec(String(s || ''));
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

function anchorInfo(anchor, base) {
  const url = normalizeUrl(anchor.tag.attrs.href, base);
  if (!url) return null;
  const title = cleanTitle(anchor.tag.attrs.title) || cleanTitle(H.text(anchor.inner));
  if (!title) return null;
  return { url, title, id: articleKey(url) };
}

// rpage-403: `.row.listBS .mtitle a`, date in `i.mdate` of the same row (may be absent).
function parse403(html, base) {
  const doc = cleanHtml(html);
  const rows = H.findTopElements(doc, (t) => t.name === 'div' && H.hasClass(t, 'row') && H.hasClass(t, 'listBS'));
  const items = [];
  for (const r of rows) {
    const mtitle = H.findElements(r.inner, (t) => H.hasClass(t, 'mtitle'))[0];
    if (!mtitle) continue;
    const a = H.findElements(mtitle.inner, (t) => t.name === 'a' && t.attrs.href)[0];
    if (!a) continue;
    const info = anchorInfo(a, base);
    if (!info) continue;
    const dateEl = H.findElements(r.inner, (t) => t.name === 'i' && H.hasClass(t, 'mdate'))[0];
    items.push({ ...info, date: dateEl ? normDate(H.text(dateEl.inner)) : null });
  }
  return items;
}

// rpage-422: only the table inside `.module-ptlist` (the page header carousel also links to articles).
function parse422(html, base) {
  const doc = cleanHtml(html);
  const modules = H.findTopElements(doc, (t) => H.hasClass(t, 'module-ptlist'));
  const items = [];
  for (const mod of modules) {
    const rows = H.findElements(mod.inner, (t) => t.name === 'tr');
    for (const r of rows) {
      const cells = H.findElements(r.inner, (t) => t.name === 'td' && t.attrs['data-th']);
      const cell = (name) => cells.find((c) => c.tag.attrs['data-th'].trim() === name);
      const titleCell = cell('標題');
      if (!titleCell) continue;
      const a = H.findElements(titleCell.inner, (t) => t.name === 'a' && t.attrs.href)[0];
      if (!a) continue;
      const info = anchorInfo(a, base);
      if (!info) continue;
      const dateCell = cell('日期');
      const unitCell = cell('公告單位');
      const unit = unitCell ? H.text(unitCell.inner).replace(/^\[(.*)\]$/, '$1').trim() : '';
      items.push({ ...info, date: dateCell ? normDate(H.text(dateCell.inner)) : null, unit: unit || null });
    }
  }
  return items;
}

function parseList(html, layout, base) {
  if (layout === 'rpage-403') return parse403(html, base);
  if (layout === 'rpage-422') return parse422(html, base);
  throw new Error(`不認得的版面：${layout}`);
}

module.exports = { parse403, parse422, parseList, normalizeUrl, articleKey, cleanTitle, normDate };
