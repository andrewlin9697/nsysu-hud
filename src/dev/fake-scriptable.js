'use strict';
// Strict fakes of the Scriptable APIs we use. Every object only accepts the properties and methods
// the real Scriptable API has (anything else throws), so tests catch typos and API misuse that
// would otherwise only show up on the phone. Dev / test only — not bundled.

// Works across vm realms (the bundle runs in its own context in tests).
function isDate(d) {
  return Object.prototype.toString.call(d) === '[object Date]' && !isNaN(d.getTime());
}

function strict(target, allowed, label) {
  const ok = new Set([...allowed, 'constructor', 'toJSON', 'then', '_kind', '_children', '_props']);
  return new Proxy(target, {
    get(t, k) {
      if (typeof k === 'symbol' || ok.has(k) || k in Object.prototype) return t[k];
      throw new Error(`Scriptable ${label} 沒有 "${String(k)}"`);
    },
    set(t, k, v) {
      if (!ok.has(k)) throw new Error(`Scriptable ${label} 不能設定 "${String(k)}"`);
      t[k] = v;
      return true;
    },
  });
}

class Color {
  constructor(hex, alpha = 1) {
    if (!/^#?[0-9a-f]{6}$/i.test(hex)) throw new Error(`Color 格式錯誤：${hex}`);
    this.hex = hex.replace('#', '');
    this.alpha = alpha;
  }
  static dynamic(light, dark) {
    if (!(light instanceof Color) || !(dark instanceof Color)) throw new Error('Color.dynamic 需要兩個 Color');
    const c = new Color(light.hex, light.alpha);
    c.dark = dark;
    return c;
  }
}

class Font {
  constructor(name, size) {
    this.name = name;
    this.size = size;
  }
}
for (const m of ['systemFont', 'boldSystemFont', 'semiboldSystemFont', 'mediumSystemFont', 'lightSystemFont', 'heavySystemFont', 'regularMonospacedSystemFont', 'boldMonospacedSystemFont', 'regularRoundedSystemFont', 'boldRoundedSystemFont']) {
  Font[m] = (size) => {
    if (typeof size !== 'number' || !(size > 0)) throw new Error(`Font.${m} 需要正數字級`);
    return new Font(m, size);
  };
}

class Size {
  constructor(w, h) {
    this.width = w;
    this.height = h;
  }
}

class Image {}

const KNOWN_SYMBOLS = /^[a-z0-9.]+$/;
class SFSymbol {
  static named(name) {
    if (!KNOWN_SYMBOLS.test(name)) return null;
    const s = { name, image: new Image(), applyFont(f) { if (!(f instanceof Font)) throw new Error('applyFont 需要 Font'); } };
    return strict(s, ['name', 'image', 'applyFont'], 'SFSymbol');
  }
}

const TEXT_PROPS = ['text', 'textColor', 'font', 'textOpacity', 'lineLimit', 'minimumScaleFactor', 'shadowColor', 'shadowRadius', 'shadowOffset', 'url', 'leftAlignText', 'centerAlignText', 'rightAlignText'];
const IMAGE_PROPS = ['image', 'resizable', 'imageSize', 'imageOpacity', 'cornerRadius', 'borderWidth', 'borderColor', 'containerRelativeShape', 'tintColor', 'url', 'leftAlignImage', 'centerAlignImage', 'rightAlignImage', 'applyFittingContentMode', 'applyFillingContentMode'];
const CONTAINER_METHODS = ['addText', 'addDate', 'addImage', 'addSpacer', 'addStack', 'setPadding', 'useDefaultPadding'];
const STACK_PROPS = ['backgroundColor', 'backgroundImage', 'backgroundGradient', 'spacing', 'size', 'cornerRadius', 'borderWidth', 'borderColor', 'url', ...CONTAINER_METHODS, 'topAlignContent', 'centerAlignContent', 'bottomAlignContent', 'layoutHorizontally', 'layoutVertically'];
const WIDGET_PROPS = ['backgroundColor', 'backgroundImage', 'backgroundGradient', 'spacing', 'url', 'refreshAfterDate', ...CONTAINER_METHODS, 'presentSmall', 'presentMedium', 'presentLarge', 'presentExtraLarge'];

function container(kind, props) {
  const node = { _kind: kind, _children: [], _props: {} };
  const noop = () => {};
  Object.assign(node, {
    addText(text) {
      if (typeof text !== 'string') throw new Error(`addText 需要字串，收到 ${typeof text}`);
      const t = strict({ _kind: 'text', text, leftAlignText: noop, centerAlignText: noop, rightAlignText: noop }, TEXT_PROPS, 'WidgetText');
      node._children.push(t);
      return t;
    },
    addDate(d) {
      const t = strict({ _kind: 'date', date: d }, TEXT_PROPS, 'WidgetDate');
      node._children.push(t);
      return t;
    },
    addImage(image) {
      if (!(image instanceof Image)) throw new Error('addImage 需要 Image');
      const i = strict({ _kind: 'image', image, leftAlignImage: noop, centerAlignImage: noop, rightAlignImage: noop, applyFittingContentMode: noop, applyFillingContentMode: noop }, IMAGE_PROPS, 'WidgetImage');
      node._children.push(i);
      return i;
    },
    addSpacer(length) {
      if (length != null && typeof length !== 'number') throw new Error('addSpacer 需要數字或不給');
      const s = strict({ _kind: 'spacer', length: length == null ? null : length }, ['length'], 'WidgetSpacer');
      node._children.push(s);
      return s;
    },
    addStack() {
      const s = container('stack', STACK_PROPS);
      node._children.push(s);
      return s;
    },
    setPadding(...p) {
      if (p.length !== 4 || p.some((x) => typeof x !== 'number')) throw new Error('setPadding 需要 4 個數字');
      node._props.padding = p;
    },
    useDefaultPadding: noop,
    topAlignContent: noop,
    centerAlignContent: noop,
    bottomAlignContent: noop,
    layoutHorizontally() { node._props.layout = 'h'; },
    layoutVertically() { node._props.layout = 'v'; },
    presentSmall: async () => { node._props.presented = 'small'; },
    presentMedium: async () => { node._props.presented = 'medium'; },
    presentLarge: async () => { node._props.presented = 'large'; },
    presentExtraLarge: async () => { node._props.presented = 'extraLarge'; },
  });
  return strict(node, props, kind === 'widget' ? 'ListWidget' : 'WidgetStack');
}

function ListWidget() {
  return container('widget', WIDGET_PROPS);
}

// Collects every text in a widget tree (for assertions).
function widgetTexts(node, out = []) {
  if (!node) return out;
  if (node._kind === 'text') out.push(node.text);
  for (const c of node._children || []) widgetTexts(c, out);
  return out;
}

function makeUI(record) {
  const CELL_PROPS = ['widthWeight', 'onTap', 'dismissOnTap', 'titleColor', 'subtitleColor', 'titleFont', 'subtitleFont', 'leftAligned', 'centerAligned', 'rightAligned', 'title', 'subtitle', 'kind'];
  const makeCell = (kind, title, subtitle) => strict({ kind, title, subtitle, leftAligned() {}, centerAligned() {}, rightAligned() {} }, CELL_PROPS, 'UITableCell');
  class UITableCell {
    static text(t, s) { return makeCell('text', t, s); }
    static button(t) { return makeCell('button', t); }
    static image() { return makeCell('image'); }
  }
  class UITableRow {
    constructor() {
      const row = { cells: [] };
      Object.assign(row, {
        addCell(c) { row.cells.push(c); },
        addText(t, s) {
          if (t != null && typeof t !== 'string') throw new Error('addText 標題要是字串');
          const c = makeCell('text', t, s);
          row.cells.push(c);
          return c;
        },
        addButton(t) {
          const c = makeCell('button', t);
          row.cells.push(c);
          return c;
        },
        addImage() {
          const c = makeCell('image');
          row.cells.push(c);
          return c;
        },
      });
      return strict(row, ['cells', 'cellSpacing', 'height', 'isHeader', 'dismissOnSelect', 'onSelect', 'backgroundColor', 'addCell', 'addText', 'addButton', 'addImage', 'addImageAtURL'], 'UITableRow');
    }
  }
  class UITable {
    constructor() {
      const t = { rows: [] };
      Object.assign(t, {
        addRow(r) { t.rows.push(r); },
        removeRow(r) { t.rows = t.rows.filter((x) => x !== r); },
        removeAllRows() { t.rows = []; },
        reload() { record.reloads = (record.reloads || 0) + 1; },
        async present(fullscreen) { record.presented = { fullscreen }; record.table = t; },
      });
      return strict(t, ['rows', 'showSeparators', 'addRow', 'removeRow', 'removeAllRows', 'reload', 'present'], 'UITable');
    }
  }
  class Alert {
    constructor() {
      const a = { actions: [] };
      Object.assign(a, {
        addAction(x) { a.actions.push(x); },
        addCancelAction(x) { a.actions.push(x); },
        addDestructiveAction(x) { a.actions.push(x); },
        async presentAlert() { record.alerts = [...(record.alerts || []), { title: a.title, message: a.message }]; return 0; },
        async presentSheet() { return 0; },
        async present() { return 0; },
      });
      return strict(a, ['title', 'message', 'actions', 'addAction', 'addCancelAction', 'addDestructiveAction', 'addTextField', 'presentAlert', 'presentSheet', 'present'], 'Alert');
    }
  }
  const Safari = { open(url) { record.opened = [...(record.opened || []), url]; }, openInApp: async () => {} };
  return { UITable, UITableRow, UITableCell, Alert, Safari };
}

/**
 * Builds a full fake Scriptable environment.
 * opts: { fetch(url) → { status, body } (may throw), calendars, events, files, family, runsInWidget }
 */
function createScriptableEnv(opts = {}) {
  const record = { requests: [], scheduled: [], removed: [] };
  const files = opts.files || {};
  const fmImpl = {
    joinPath: (a, b) => `${a.replace(/\/$/, '')}/${b}`,
    libraryDirectory: () => '/Library',
    documentsDirectory: () => '/Documents',
    cacheDirectory: () => '/Caches',
    temporaryDirectory: () => '/tmp',
    fileExists: (p) => p in files || Object.keys(files).some((k) => k.startsWith(`${p}/`)) || (files.__dirs || []).includes(p),
    isDirectory: (p) => (files.__dirs || []).includes(p),
    createDirectory: (p) => { files.__dirs = [...(files.__dirs || []), p]; },
    readString: (p) => {
      if (!(p in files)) throw new Error(`找不到檔案 ${p}`);
      return files[p].content;
    },
    writeString: (p, s) => {
      if (typeof s !== 'string') throw new Error('writeString 需要字串');
      files[p] = { content: s, mtime: opts.now ? opts.now() : new Date() };
    },
    remove: (p) => { delete files[p]; },
    listContents: (dir) => Object.keys(files).filter((k) => k.startsWith(`${dir}/`)).map((k) => k.slice(dir.length + 1)),
    modificationDate: (p) => (files[p] ? files[p].mtime : null),
  };
  const FileManager = {
    local: () => strict({ ...fmImpl }, Object.keys(fmImpl), 'FileManager'),
    iCloud: () => strict({ ...fmImpl }, Object.keys(fmImpl), 'FileManager'),
  };

  class Request {
    constructor(url) {
      if (typeof url !== 'string') throw new Error('Request 需要網址字串');
      const r = { url, method: 'GET', headers: {}, timeoutInterval: 60, response: null };
      r.loadString = async () => {
        record.requests.push(r.url);
        const res = await (opts.fetch ? opts.fetch(r.url, r) : { status: 404, body: '' });
        r.response = { statusCode: res.status, headers: {} };
        return res.body;
      };
      r.loadJSON = async () => JSON.parse(await r.loadString());
      return strict(r, ['url', 'method', 'headers', 'body', 'timeoutInterval', 'response', 'allowInsecureRequest', 'load', 'loadString', 'loadJSON', 'loadImage'], 'Request');
    }
  }

  const calendars = (opts.calendars || ['個人', '台灣節日']).map((title) => ({ title, identifier: title }));
  const Calendar = { forEvents: async () => calendars };
  const CalendarEvent = {
    between: async (start, end, cals) => {
      if (!isDate(start) || !isDate(end)) throw new Error('CalendarEvent.between 需要 Date');
      if (opts.calendarDenied) throw new Error('Calendar access denied');
      const names = new Set((cals || []).map((c) => c.title));
      return (opts.events || [])
        .filter((e) => names.size === 0 || names.has(e.calendar || '個人'))
        .filter((e) => e.end > start && e.start < end)
        .map((e) => ({ title: e.title, startDate: e.start, endDate: e.end, isAllDay: !!e.allDay, location: e.location || null, notes: e.notes || null, calendar: { title: e.calendar || '個人' } }));
    },
  };

  class Notification {
    constructor() {
      const n = {};
      n.setTriggerDate = (d) => {
        if (!isDate(d)) throw new Error('setTriggerDate 需要 Date');
        n._trigger = d;
      };
      n.schedule = async () => { record.scheduled.push({ id: n.identifier, title: n.title, body: n.body, at: n._trigger }); };
      return strict(n, ['identifier', 'title', 'subtitle', 'body', 'threadIdentifier', 'sound', 'openURL', 'userInfo', 'setTriggerDate', 'schedule', 'remove', '_trigger'], 'Notification');
    }
    static async removePending(ids) {
      if (!Array.isArray(ids)) throw new Error('removePending 需要陣列');
      record.removed.push(...ids);
    }
  }

  const Script = {
    setWidget(w) { record.widget = w; },
    complete() { record.completed = true; },
    name: () => 'NSYSU HUD',
  };

  const ui = makeUI(record);
  const globals = {
    ListWidget, Color, Font, Size, SFSymbol, Request, FileManager, Calendar, CalendarEvent, Notification, Script, ...ui,
    config: {
      runsInWidget: !!opts.runsInWidget,
      runsInApp: !opts.runsInWidget,
      widgetFamily: opts.runsInWidget ? opts.family || 'large' : null,
    },
    args: { widgetParameter: opts.widgetParameter || null, queryParameters: {} },
  };
  return { globals, record, files };
}

module.exports = { createScriptableEnv, widgetTexts, strict, Color, Font };
