'use strict';
// Plain-text renderer of the layout model, for `npm run preview` (no iPhone needed).

const COLOR_TAG = { red: '紅', orange: '橘', green: '綠', up: '紅', down: '綠', blue: '藍', yellow: '黃', gray: '灰' };
const ANSI = { red: 31, up: 31, orange: 33, yellow: 33, green: 32, down: 32, blue: 34, gray: 90, secondary: 90, tertiary: 90 };

// Rough emoji stand-ins for SF Symbols so the preview stays readable.
const SYMBOL_TEXT = {
  'exclamationmark.triangle.fill': '⚠', 'pencil.circle.fill': '✎', 'clock.fill': '⏰', 'calendar': '📅',
  'umbrella.fill': '☂', 'umbrella': '☂', 'sun.max.fill': '☀', 'moon.stars.fill': '☾', 'moon.fill': '☾',
  'cloud.sun.fill': '⛅', 'cloud.moon.fill': '☁', 'cloud.fill': '☁', 'cloud': '☁', 'cloud.fog.fill': '🌫',
  'cloud.drizzle.fill': '🌦', 'cloud.rain.fill': '🌧', 'cloud.heavyrain.fill': '🌧', 'cloud.snow.fill': '🌨',
  'cloud.sun.rain.fill': '🌦', 'cloud.moon.rain.fill': '🌧', 'cloud.bolt.rain.fill': '⛈', 'bicycle': '🚲',
  'book.fill': '📘', 'book': '📖', 'cup.and.saucer.fill': '☕', 'checkmark.circle.fill': '✓', 'chart.bar.fill': '📈',
  'megaphone.fill': '📢', 'megaphone': '📢', 'sunrise.fill': '🌅', 'moon.zzz.fill': '💤',
  'exclamationmark.circle': '!',
};

function symbolText(name) {
  return name ? SYMBOL_TEXT[name] || '•' : ' ';
}

function paint(text, color, opts) {
  if (!text) return '';
  if (opts.ansi) {
    const code = ANSI[color];
    return code ? `\u001b[${code}m${text}\u001b[0m` : text;
  }
  return text;
}

function segsText(segs, opts, muted) {
  let out = '';
  const tags = new Set();
  for (const s of segs || []) {
    const color = muted ? 'gray' : s.c;
    out += paint(s.b && opts.ansi ? `\u001b[1m${s.t}\u001b[22m` : s.t, color, opts);
    if (!opts.ansi && s.t.trim() && COLOR_TAG[color]) tags.add(COLOR_TAG[color]);
  }
  return { out, tags };
}

// East Asian characters take two columns.
function width(str) {
  let w = 0;
  for (const ch of str.replace(/\u001b\[[0-9;]*m/g, '')) {
    const cp = ch.codePointAt(0);
    w += cp > 0x2e7f || (cp >= 0x1f300 && cp <= 0x1faff) ? 2 : 1;
  }
  return w;
}

function line(left, right, cols) {
  const gap = Math.max(1, cols - width(left) - width(right));
  return left + ' '.repeat(gap) + right;
}

function renderRow(r, opts, cols, indent) {
  const l = segsText(r.left, opts, r.muted);
  const rt = segsText(r.right, opts, r.muted);
  const tags = new Set([...l.tags, ...rt.tags]);
  if (r.muted && !opts.ansi) tags.add('灰');
  const icon = r.icon ? `${symbolText(r.icon)} ` : '';
  const tagText = !opts.ansi && tags.size ? `  〔${[...tags].join('')}〕` : '';
  const size = r.big ? '（大字）' : '';
  return line(`${indent}${icon}${l.out}${size}`, `${rt.out}${tagText}`, cols);
}

function renderText(layout, opts = {}) {
  const cols = opts.cols || 72;
  const out = [];
  const head = `${symbolText(layout.symbol)} ${layout.title}  ${layout.subtitle}`;
  const hr = layout.headerRight ? `${symbolText(layout.headerRight.icon)} ${layout.headerRight.text}` : '';
  out.push(line(head, hr, cols));
  if (layout.family === 'small') {
    for (const g of layout.glance) {
      const tag = !opts.ansi && COLOR_TAG[g.color] ? `  〔${COLOR_TAG[g.color]}〕` : '';
      out.push(`  ${symbolText(g.icon)} ${paint(g.title, g.color, opts)}${tag}`);
      if (g.detail) out.push(`     ${paint(g.detail, 'secondary', opts)}`);
    }
  } else {
    for (const s of layout.sections) {
      const tone = s.tone === 'alert' && layout.showTitles ? (opts.ansi ? '' : '〔紅底〕') : '';
      const title = layout.showTitles && s.title ? `${s.title}${tone}` : tone;
      const tr = layout.showTitles ? segsText(s.titleRight, opts).out : '';
      out.push(line(title ? `┌ ${title}` : '┌', tr, cols));
      for (const r of s.rows) out.push(renderRow(r, opts, cols, '│ '));
      if (s.truncated) out.push('│ …');
    }
  }
  out.push(line('', segsText(layout.footer.right, opts).out, cols));
  return out.join('\n');
}

module.exports = { renderText, width };
