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

// Column roles from header labels (data-th on the cells, or the table's <th> row).
const ROLE_RE = {
  date: /^(日期|公告日期|發布日期|Date)$/i,
  title: /^(標題|主旨|公告標題|Title|Subject)$/i,
  unit: /^(公告單位|發布單位|單位|Unit|Department|Publisher)$/i,
};

function roleOf(label) {
  const l = String(label || '').replace(/\s+/g, '');
  return Object.keys(ROLE_RE).find((k) => ROLE_RE[k].test(l)) || null;
}

function tableItems(table, base) {
  const headers = H.findElements(table.inner, (t) => t.name === 'th').map((th) => roleOf(H.text(th.inner)));
  const items = [];
  for (const r of H.findElements(table.inner, (t) => t.name === 'tr')) {
    const cells = H.findElements(r.inner, (t) => t.name === 'td');
    if (!cells.length) continue;
    // Prefer data-th, then the header row by position, then what the cell looks like.
    const pick = (role) => {
      const byAttr = cells.find((c) => roleOf(c.tag.attrs['data-th']) === role);
      if (byAttr) return byAttr;
      const i = headers.indexOf(role);
      return i >= 0 && headers.length === cells.length ? cells[i] : null;
    };
    const titleCell = pick('title') || cells.find((c) => H.findElements(c.inner, (t) => t.name === 'a' && t.attrs.href).length);
    if (!titleCell) continue;
    const a = H.findElements(titleCell.inner, (t) => t.name === 'a' && t.attrs.href)[0];
    if (!a) continue;
    const info = anchorInfo(a, base);
    if (!info) continue;
    const dateCell = pick('date') || cells.find((c) => c !== titleCell && normDate(H.text(c.inner)));
    const unitCell = pick('unit') || cells.find((c) => c !== titleCell && c !== dateCell && /^\[.*\]$/.test(H.text(c.inner)));
    const unit = unitCell ? H.text(unitCell.inner).replace(/^\[(.*)\]$/, '$1').trim() : '';
    items.push({ ...info, date: dateCell ? normDate(H.text(dateCell.inner)) : null, unit: unit || null });
  }
  return items;
}

// rpage-422: only the list inside `.module-ptlist` (the page header carousel also links to articles).
// Usually a table; `data-th` labels may be added by the page's JavaScript, so the server HTML can
// lack them. Falls back to 403-style rows inside the same module.
function parse422(html, base) {
  const doc = cleanHtml(html);
  const modules = H.findTopElements(doc, (t) => H.hasClass(t, 'module-ptlist'));
  const items = [];
  for (const mod of modules) {
    for (const table of H.findTopElements(mod.inner, (t) => t.name === 'table')) items.push(...tableItems(table, base));
  }
  if (!items.length) for (const mod of modules) items.push(...parse403(mod.outer, base));
  return items;
}

// Short, log-safe description of a page that yielded nothing, to tell layout changes from
// JavaScript-rendered lists or blocked requests.
function describePage(html) {
  const doc = cleanHtml(html);
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(String(html));
  const count = (pred) => H.findTopElements(doc, pred).length;
  const parts = [
    `HTML ${String(html).length} 字`,
    `標題「${title ? H.text(title[1]).slice(0, 40) : '（沒有）'}」`,
    `module-ptlist ${count((t) => H.hasClass(t, 'module-ptlist'))} 個`,
    `表格 ${count((t) => t.name === 'table')} 個`,
    `listBS ${count((t) => H.hasClass(t, 'listBS'))} 列`,
    `文章連結 ${(doc.match(/\/p\/40[46]-\d+-\d+/g) || []).length} 個`,
  ];
  return parts.join('，');
}

function parseList(html, layout, base) {
  if (layout === 'rpage-403') return parse403(html, base);
  if (layout === 'rpage-422') return parse422(html, base);
  throw new Error(`不認得的版面：${layout}`);
}

module.exports = { parse403, parse422, parseList, describePage, normalizeUrl, articleKey, cleanTitle, normDate };
