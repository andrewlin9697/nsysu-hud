'use strict';
// Draws the layout model with Scriptable's ListWidget. All Scriptable classes come in through `sc`
// (the real globals on the phone, fakes in Node tests).

// [light, dark] — iOS system colours
const PALETTE = {
  bg: ['#FFFFFF', '#1C1C1E'],
  card: ['#F2F2F7', '#2C2C2E'],
  alertCard: ['#FFECEB', '#3A1F1D'],
  primary: ['#000000', '#FFFFFF'],
  secondary: ['#3C3C43', '#EBEBF5', 0.6],
  tertiary: ['#3C3C43', '#EBEBF5', 0.35],
  gray: ['#8E8E93', '#8E8E93'],
  red: ['#FF3B30', '#FF453A'],
  orange: ['#FF9500', '#FF9F0A'],
  yellow: ['#FFCC00', '#FFD60A'],
  green: ['#34C759', '#30D158'],
  blue: ['#007AFF', '#0A84FF'],
};
const ALIASES = { up: 'red', down: 'green' };

function makeTheme(sc) {
  const cache = {};
  return (token) => {
    const key = ALIASES[token] || (PALETTE[token] ? token : 'primary');
    if (!cache[key]) {
      const [light, dark, alpha] = PALETTE[key];
      cache[key] = sc.Color.dynamic(new sc.Color(light, alpha == null ? 1 : alpha), new sc.Color(dark, alpha == null ? 1 : alpha));
    }
    return cache[key];
  };
}

const SIZES = {
  large: { pad: [12, 14, 10, 14], title: 15, sub: 12, header: 11, row: 13, big: 18, foot: 9, cardPad: [5, 9, 5, 9], gap: 5, rowGap: 2 },
  medium: { pad: [11, 14, 9, 14], title: 14, sub: 11.5, header: 10.5, row: 12.5, big: 16, foot: 8.5, cardPad: [0, 0, 0, 0], gap: 4, rowGap: 1.5 },
  small: { pad: [12, 12, 10, 12], title: 13, sub: 10.5, header: 10, row: 12.5, big: 15, foot: 8.5, cardPad: [0, 0, 0, 0], gap: 6, rowGap: 1 },
};

function addSymbol(sc, stack, name, size, color) {
  if (!name) return null;
  let sym = sc.SFSymbol.named(name);
  if (!sym || !sym.image) sym = sc.SFSymbol.named('circle.fill');
  if (!sym || !sym.image) return null;
  sym.applyFont(sc.Font.systemFont(size));
  const img = stack.addImage(sym.image);
  img.imageSize = new sc.Size(size + 2, size + 2);
  img.tintColor = color;
  img.resizable = true;
  return img;
}

function addText(sc, stack, text, font, color, opts = {}) {
  const t = stack.addText(text);
  t.font = font;
  t.textColor = color;
  t.lineLimit = opts.lines || 1;
  t.minimumScaleFactor = opts.scale || 0.75;
  return t;
}

function addSegs(sc, stack, segs, size, theme, muted, defaultColor) {
  for (const s of segs || []) {
    if (!s.t) continue;
    const color = muted ? theme('gray') : theme(s.c || defaultColor || 'primary');
    addText(sc, stack, s.t, s.b ? sc.Font.semiboldSystemFont(size) : sc.Font.systemFont(size), color);
  }
}

function renderRow(sc, parent, r, z, theme) {
  const st = parent.addStack();
  st.layoutHorizontally();
  st.centerAlignContent();
  st.spacing = 0;
  const size = r.big ? z.big : z.row;
  if (r.icon) {
    addSymbol(sc, st, r.icon, size - 1, r.muted ? theme('gray') : theme(r.iconColor || 'secondary'));
    st.addSpacer(5);
  }
  addSegs(sc, st, r.left, size, theme, r.muted);
  st.addSpacer();
  if (r.right && r.right.length) {
    st.addSpacer(6);
    addSegs(sc, st, r.right, size - (r.big ? 3 : 1), theme, r.muted, 'secondary');
  }
  if (r.url) st.url = r.url;
  return st;
}

function renderHeader(sc, w, layout, z, theme) {
  const h = w.addStack();
  h.layoutHorizontally();
  h.centerAlignContent();
  addSymbol(sc, h, layout.symbol, z.title - 1, theme('secondary'));
  h.addSpacer(5);
  addText(sc, h, layout.title, sc.Font.boldSystemFont(z.title), theme('primary'));
  h.addSpacer(6);
  addText(sc, h, layout.subtitle, sc.Font.mediumSystemFont(z.sub), theme('secondary'), { scale: 0.6 });
  h.addSpacer();
  if (layout.headerRight) {
    const color = layout.headerRight.muted ? theme('gray') : theme('secondary');
    addSymbol(sc, h, layout.headerRight.icon, z.sub, color);
    h.addSpacer(3);
    addText(sc, h, layout.headerRight.text, sc.Font.semiboldSystemFont(z.sub + 1), layout.headerRight.muted ? theme('gray') : theme('primary'));
  }
}

function renderSection(sc, w, s, z, theme, family) {
  const card = w.addStack();
  card.layoutVertically();
  card.spacing = z.rowGap;
  if (family === 'large') {
    card.backgroundColor = s.tone === 'alert' ? theme('alertCard') : theme('card');
    card.cornerRadius = 12;
    card.setPadding(...z.cardPad);
  }
  if (family === 'large' && (s.title || (s.titleRight && s.titleRight.length))) {
    const h = card.addStack();
    h.layoutHorizontally();
    h.centerAlignContent();
    addText(sc, h, s.title || '', sc.Font.semiboldSystemFont(z.header), s.tone === 'alert' ? theme('red') : theme('secondary'));
    h.addSpacer();
    addSegs(sc, h, s.titleRight, z.header, theme, false, 'secondary');
  }
  for (const r of s.rows) renderRow(sc, card, r, z, theme);
  return card;
}

function renderSmall(sc, w, layout, z, theme) {
  for (const g of layout.glance) {
    const item = w.addStack();
    item.layoutVertically();
    item.spacing = 0;
    const top = item.addStack();
    top.layoutHorizontally();
    top.centerAlignContent();
    addSymbol(sc, top, g.icon, z.row - 1, theme(g.color || 'secondary'));
    top.addSpacer(4);
    addText(sc, top, g.title, sc.Font.semiboldSystemFont(z.row), theme(g.color === 'gray' ? 'gray' : g.color || 'primary'));
    if (g.detail) addText(sc, item, g.detail, sc.Font.systemFont(z.sub), theme('secondary'));
    w.addSpacer(z.gap);
  }
}

function renderFooter(sc, w, layout, z, theme) {
  const f = w.addStack();
  f.layoutHorizontally();
  f.addSpacer();
  addSegs(sc, f, layout.footer.right, z.foot, theme, false, 'tertiary');
}

function renderWidget(layout, sc) {
  const theme = makeTheme(sc);
  const family = layout.family;
  const z = SIZES[family] || SIZES.small;
  const w = new sc.ListWidget();
  w.backgroundColor = theme('bg');
  w.setPadding(...z.pad);
  renderHeader(sc, w, layout, z, theme);
  w.addSpacer(6);
  if (family === 'small') {
    renderSmall(sc, w, layout, z, theme);
  } else {
    layout.sections.forEach((s, i) => {
      if (i) w.addSpacer(z.gap);
      renderSection(sc, w, s, z, theme, family);
    });
  }
  w.addSpacer();
  renderFooter(sc, w, layout, z, theme);
  if (layout.refreshAt) w.refreshAfterDate = layout.refreshAt;
  return w;
}

// Shown when something unexpected breaks before a layout exists.
function renderError(sc, message, now) {
  const theme = makeTheme(sc);
  const w = new sc.ListWidget();
  w.backgroundColor = theme('bg');
  w.setPadding(14, 14, 12, 14);
  const h = w.addStack();
  h.centerAlignContent();
  addSymbol(sc, h, 'exclamationmark.triangle.fill', 13, theme('orange'));
  h.addSpacer(5);
  addText(sc, h, 'NSYSU HUD 暫時出錯', sc.Font.boldSystemFont(14), theme('primary'));
  w.addSpacer(6);
  addText(sc, w, message, sc.Font.systemFont(11), theme('secondary'), { lines: 4 });
  w.addSpacer();
  addText(sc, w, `點一下重試 · ${now}`, sc.Font.systemFont(9), theme('tertiary'));
  w.refreshAfterDate = new Date(Date.now() + 15 * 60000);
  return w;
}

module.exports = { renderWidget, renderError, makeTheme, PALETTE };
