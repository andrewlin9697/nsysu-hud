'use strict';
// Minimal, strict HTML helpers (no dependencies). Elements are located with a tag scanner and
// extracted by balancing open/close tags of the same name, so nested markup can't leak in.

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };

function decodeEntities(s) {
  return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (m, e) => {
    if (e[0] === '#') {
      const cp = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return isFinite(cp) && cp > 0 ? String.fromCodePoint(cp) : m;
    }
    const v = ENTITIES[e.toLowerCase()];
    return v == null ? m : v;
  });
}

function stripComments(html) {
  return String(html).replace(/<!--[\s\S]*?-->/g, '');
}

function parseAttrs(src) {
  const attrs = {};
  const re = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(src))) {
    const v = m[2] != null ? m[2] : m[3] != null ? m[3] : m[4] != null ? m[4] : '';
    attrs[m[1].toLowerCase()] = decodeEntities(v);
  }
  return attrs;
}

// All start tags: { name, attrs, start, end } where end is the index just after '>'.
function scanTags(html) {
  const tags = [];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:\s+(?:[^\s"'<>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?))*)\s*(\/?)>/g;
  let m;
  while ((m = re.exec(html))) {
    tags.push({ close: m[1] === '/', name: m[2].toLowerCase(), attrs: m[1] ? {} : parseAttrs(m[3]), start: m.index, end: re.lastIndex, selfClose: m[4] === '/' });
  }
  return tags;
}

function hasClass(tag, cls) {
  return (` ${(tag.attrs.class || '').replace(/\s+/g, ' ')} `).includes(` ${cls} `);
}

// Element matching predicate → [{ tag, inner, outer }], balancing same-name tags.
function findElements(html, predicate) {
  const tags = scanTags(html);
  const out = [];
  for (let i = 0; i < tags.length; i++) {
    const t = tags[i];
    if (t.close || !predicate(t)) continue;
    if (VOID_TAGS.has(t.name) || t.selfClose) {
      out.push({ tag: t, inner: '', outer: html.slice(t.start, t.end) });
      continue;
    }
    let depth = 1;
    let j = i + 1;
    for (; j < tags.length; j++) {
      const u = tags[j];
      if (u.name !== t.name || (!u.close && u.selfClose)) continue;
      depth += u.close ? -1 : 1;
      if (depth === 0) break;
    }
    const closeTag = tags[j];
    const innerEnd = closeTag ? closeTag.start : html.length;
    const outerEnd = closeTag ? closeTag.end : html.length;
    out.push({ tag: t, inner: html.slice(t.end, innerEnd), outer: html.slice(t.start, outerEnd) });
  }
  return out;
}

// Outermost matches only (an element nested inside another match is skipped).
function findTopElements(html, predicate) {
  const all = findElements(html, predicate);
  const out = [];
  let until = -1;
  for (const el of all) {
    if (el.tag.start < until) continue;
    out.push(el);
    until = el.tag.start + el.outer.length;
  }
  return out;
}

function text(html) {
  return decodeEntities(String(html).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

module.exports = { decodeEntities, stripComments, parseAttrs, scanTags, hasClass, findElements, findTopElements, text };
