/* 1С·декс: переключение языка интерфейса (RU / EN).
   Курс подменяется данными из CONTENT_EN, интерфейс переводится словарём по текстовым узлам. */
var I18N = (function () {
  'use strict';
  let lang = 'ru';
  try {
    const st = JSON.parse(localStorage.getItem('odindex.v1') || '{}');
    if (st.lang === 'en' || st.lang === 'ru') lang = st.lang;
    else if (!/^(ru|uk|be|kk)\b/i.test(navigator.language || 'ru')) lang = 'en';
  } catch (e) { /* хранилище недоступно */ }

  const CY = /[А-Яа-яЁё]/;
  const DICT = (typeof I18N_DICT !== 'undefined' ? I18N_DICT : {});
  const RULES = (typeof I18N_RULES !== 'undefined' ? I18N_RULES : []);
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  const dict = new Map();
  Object.keys(DICT).forEach(k => dict.set(norm(k), DICT[k]));
  const miss = new Set();

  function t(s) {
    if (lang !== 'en' || s == null) return s;
    s = String(s);
    if (!CY.test(s)) return s;
    const k = norm(s);
    if (dict.has(k)) {
      const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
      return lead + dict.get(k) + trail;
    }
    const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0], raw = s.trim();
    for (const [re, rep] of RULES) {
      const src = re.test(raw) ? raw : (re.test(k) ? k : null);
      if (src !== null) { re.lastIndex = 0; return lead + src.replace(re, rep) + trail; }
    }
    miss.add(k);
    return s;
  }

  const SKIP = 'pre, code, kbd, textarea, script, style, .gutter, .ac-i > span:not(.ac-h):not(.ac-k), .out .m, .out .w, .tour-text, [data-noi18n], [contenteditable]';
  const ATTRS = ['title', 'aria-label', 'placeholder', 'alt'];
  function fixEl(el) {
    for (const a of ATTRS) {
      const v = el.getAttribute && el.getAttribute(a);
      if (v && CY.test(v)) { const nv = t(v); if (nv !== v) el.setAttribute(a, nv); }
    }
  }
  function fixText(n) {
    const v = n.nodeValue;
    if (!v || !CY.test(v)) return;
    const p = n.parentElement;
    if (!p || p.closest(SKIP)) return;
    const nv = t(v);
    if (nv !== v) n.nodeValue = nv;
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { fixText(root); return; }
    if (root.nodeType !== 1) return;
    if (root.closest && root.closest(SKIP)) return;
    fixEl(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.nodeType === 1 && n.matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT)
    });
    let n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) fixText(n); else fixEl(n); }
  }
  let obs = null;
  function start() {
    if (lang !== 'en') return;
    document.documentElement.lang = 'en';
    document.title = t(document.title);
    const md = document.querySelector('meta[name="description"]');
    if (md) md.content = t(md.content);
    walk(document.body);
    obs = new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === 'childList') m.addedNodes.forEach(walk);
        else if (m.type === 'characterData') fixText(m.target);
        else if (m.type === 'attributes') fixEl(m.target);
      }
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  // подмена курса английской версией; код в примерах остаётся русским
  function applyContent(C, E) {
    if (lang !== 'en' || !C || !E) return;
    C.chapters.forEach(ch => { if (E.chapters[ch.id]) Object.assign(ch, E.chapters[ch.id]); });
    const swap = (item, e) => {
      if (!e) return;
      const snips = (item.theory || '').match(/<pre class="snip[\s\S]*?<\/pre>/g) || [];
      if (e.title) item.title = e.title;
      if (e.theory) item.theory = e.theory.replace(/\{\{(\d+)\}\}/g, (m, n) => snips[n - 1] || '');
      if (e.tasks) item.tasks = e.tasks;
      if (e.hint) item.hint = e.hint;
      if (e.quiz && item.quiz) item.quiz.forEach((q, i) => Object.assign(q, e.quiz[i]));
    };
    C.lessons.forEach(l => swap(l, E.lessons[l.id]));
    C.challenges.forEach(c => { swap(c, E.challenges[c.id]); if (E.levelNames[c.level]) c.level = E.levelNames[c.level]; });
    C.badges.forEach(b => { if (E.badges[b.id]) Object.assign(b, E.badges[b.id]); });
    E.levels.forEach((v, i) => { C.levels[i] = v; });
    C.cheats.forEach((c, i) => { if (E.cheats[i]) c.t = E.cheats[i]; });
    C.sandboxExamples.forEach((c, i) => { if (E.sandboxExamples[i]) c.t = E.sandboxExamples[i]; });
  }

  return { lang, t, start, walk, applyContent, miss, locale: lang === 'en' ? 'en-GB' : 'ru' };
})();
if (typeof CONTENT !== 'undefined' && typeof CONTENT_EN !== 'undefined') I18N.applyContent(CONTENT, CONTENT_EN);
if (typeof document !== 'undefined' && document.body) I18N.start();
