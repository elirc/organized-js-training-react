/**
 * Smoke test: renders every view under a hand-rolled DOM stub, then checks
 * that every question grades its own correct answer as correct and a wrong
 * answer as wrong. Zero dependencies - `node scripts/smoke.mjs`.
 *
 * The stub below is deliberately tiny: it implements only the handful of DOM
 * methods `lib/dom.js` actually uses. If a view starts needing more of the
 * platform, add it here rather than reaching for jsdom.
 */
class NodeBase {}
globalThis.Node = NodeBase;

function matches(el, sel) {
  return sel.split(',').map((s) => s.trim()).some((one) => {
    if (!one) return false;
    if (one.startsWith('[')) {
      const name = one.slice(1, -1).split('=')[0];
      return el.attrs.has(name) || (name.startsWith('data-') && el.dataset[name.slice(5)] !== undefined);
    }
    const parts = one.split('.');
    const tag = parts[0];
    if (tag && el.tagName !== tag.toUpperCase()) return false;
    return parts.slice(1).every((c) => el.classes.has(c));
  });
}

class Element extends NodeBase {
  constructor(tag) {
    super();
    this.tagName = tag.toUpperCase();
    this.childNodes = [];
    this.classes = new Set();
    this.attrs = new Map();
    this.style = { setProperty(name, value) { this[name] = value; } };
    this.dataset = {};
    this.parentElement = null;
    this._text = '';
    this._html = '';
    this.listeners = {};
    const self = this;
    this.classList = {
      add: (...c) => c.forEach((x) => self.classes.add(x)),
      remove: (...c) => c.forEach((x) => self.classes.delete(x)),
      contains: (c) => self.classes.has(c),
      toggle: (c, force) => {
        const on = force === undefined ? !self.classes.has(c) : force;
        on ? self.classes.add(c) : self.classes.delete(c);
        return on;
      },
    };
  }
  get children() { return this.childNodes.filter((c) => c instanceof Element); }
  get firstChild() { return this.childNodes[0]; }
  set textContent(v) { this._text = String(v); this.childNodes = []; }
  get textContent() { return this._text || this.childNodes.map((c) => c.textContent ?? '').join(''); }
  set innerHTML(v) { this._html = String(v); }
  get innerHTML() { return this._html; }
  append(...nodes) {
    for (const n of nodes) { if (n instanceof Element) n.parentElement = this; this.childNodes.push(n); }
  }
  replaceChildren(...nodes) { this.childNodes = []; this.append(...nodes); }
  setAttribute(k, v) { this.attrs.set(k, v); }
  getAttribute(k) { return this.attrs.get(k); }
  addEventListener(t, fn) { (this.listeners[t] ??= []).push(fn); }
  removeEventListener() {}
  dispatch(type, ev = {}) { (this.listeners[type] ?? []).forEach((fn) => fn({ target: this, currentTarget: this, preventDefault() {}, ...ev })); }
  remove() { if (this.parentElement) this.parentElement.childNodes = this.parentElement.childNodes.filter((c) => c !== this); }
  scrollIntoView() {}
  focus() {}
  click() { this.dispatch('click'); }
  closest() { return null; }
  querySelector(sel) { return this.querySelectorAll(sel)[0] ?? null; }
  querySelectorAll(sel) {
    const out = [];
    const walk = (el) => { for (const c of el.children) { if (matches(c, sel)) out.push(c); walk(c); } };
    walk(this);
    return out;
  }
}
class TextNode extends NodeBase {
  constructor(t) { super(); this._t = String(t); }
  get textContent() { return this._t; }
}
globalThis.HTMLInputElement = Element;

const body = new Element('body');
globalThis.document = {
  body,
  createElement: (t) => new Element(t),
  createTextNode: (t) => new TextNode(t),
  getElementById: (id) => {
    let found = null;
    const walk = (el) => { for (const c of el.children) { if (found) return; if (c.attrs.get('id') === id) { found = c; return; } walk(c); } };
    walk(body);
    return found;
  },
  querySelector: (s) => body.querySelector(s),
  querySelectorAll: (s) => body.querySelectorAll(s),
  addEventListener() {}, removeEventListener() {},
};

const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
};

globalThis.location = { hash: '#/', protocol: 'http:', reload() {} };
globalThis.HashChangeEvent = class { constructor(t) { this.type = t; } };
globalThis.MutationObserver = class { observe() {} disconnect() {} };
globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() {}, scrollTo() {} };
globalThis.confirm = () => true;

/* ---------------- run ---------------- */
const base = new URL('../src', import.meta.url).href;
const { TRACKS, ALL_MODULES, ALL_QUESTIONS } = await import(base + '/content/index.js');
const store = await import(base + '/lib/store.js');
const home = (await import(base + '/views/home.js')).default;
const { tracksView, trackView } = await import(base + '/views/tracks.js');
const moduleView = (await import(base + '/views/module.js')).default;
const quiz = await import(base + '/views/quiz.js');
const boardView = (await import(base + '/views/board.js')).default;
const referenceView = (await import(base + '/views/reference.js')).default;
const statsView = (await import(base + '/views/stats.js')).default;
const { questionCard } = await import(base + '/components/question-card.js');

let failures = 0;
const check = (name, fn) => {
  try { const el = fn(); if (!el) throw new Error('returned nothing'); console.log('  ok    ' + name); return el; }
  catch (e) { failures++; console.log('  FAIL  ' + name + ' :: ' + e.message + '\n' + (e.stack ?? '').split('\n')[1]); }
};

console.log('rendering views');
check('home', () => home());
check('tracks', () => tracksView());
for (const t of TRACKS) check('track/' + t.id, () => trackView({ id: t.id }));
for (const m of ALL_MODULES) check('module/' + m.id, () => moduleView({ id: m.id }));
check('quiz setup', () => quiz.quizSetupView({}));
check('quiz setup (weak preset)', () => quiz.quizSetupView({ mode: 'weak' }));
check('quiz setup (track filter)', () => quiz.quizSetupView({ tracks: 'react' }));
check('interview', () => quiz.interviewView());
check('review (empty)', () => quiz.reviewView());
check('board', () => boardView());
check('reference', () => referenceView());
check('stats', () => statsView());

console.log('\nexercising every question type');
const seenTypes = new Set();
for (const q of ALL_QUESTIONS) {
  if (seenTypes.has(q.type)) continue;
  seenTypes.add(q.type);
  check('card:' + q.type + ' (' + q.id + ')', () => {
    const card = questionCard(q, { onAnswer: () => {}, onContinue: () => {} });
    // simulate answering
    const choices = card.el.querySelectorAll('.choice');
    if (choices.length) choices[0].click();
    return card.el;
  });
}

console.log('\ngrading correctness');
let graded = 0;
for (const q of ALL_QUESTIONS.filter((x) => ['mcq', 'tf', 'multi'].includes(x.type))) {
  let got = null;
  const card = questionCard(q, { onAnswer: (r) => { got = r; } });
  const choices = card.el.querySelectorAll('.choice');
  if (q.type === 'mcq') choices[q.answer].click();
  else if (q.type === 'tf') choices[q.answer ? 0 : 1].click();
  else { q.answer.forEach((i) => choices[i].click()); card.el.querySelectorAll('.btn')[0].click(); }
  if (!got?.correct) { failures++; console.log('  FAIL  correct answer graded wrong: ' + q.id); }
  else graded++;
}
console.log('  ok    ' + graded + ' questions grade their own correct answer as correct');

console.log('\nsession flow');
check('startSession + sessionView', () => {
  quiz.startSession({ questions: ALL_QUESTIONS.slice(0, 3), title: 'T', returnTo: '#/' });
  const el = quiz.sessionView();
  // answer all three
  for (let i = 0; i < 3; i++) {
    const card = el.querySelectorAll('.q-card')[0];
    const choice = el.querySelectorAll('.choice')[0];
    if (choice) choice.click();
    const next = el.querySelectorAll('.btn.primary').pop();
    if (next) next.click();
  }
  el.cleanup?.();
  return el;
});
check('stats after answers', () => statsView());
check('review after answers', () => quiz.reviewView());

console.log('\nnegative grading');
let neg = 0;
for (const q of ALL_QUESTIONS.filter((x) => x.type === 'mcq' && x.choices.length > 1)) {
  let got = null;
  const card = questionCard(q, { onAnswer: (r) => { got = r; } });
  const choices = card.el.querySelectorAll('.choice');
  choices[q.answer === 0 ? 1 : 0].click();
  if (got?.correct !== false) { failures++; console.log('  FAIL  wrong answer accepted: ' + q.id); }
  else neg++;
}
for (const q of ALL_QUESTIONS.filter((x) => x.type === 'tf')) {
  let got = null;
  const card = questionCard(q, { onAnswer: (r) => { got = r; } });
  card.el.querySelectorAll('.choice')[q.answer ? 1 : 0].click();
  if (got?.correct !== false) { failures++; console.log('  FAIL  wrong tf accepted: ' + q.id); }
  else neg++;
}
console.log('  ok    ' + neg + ' wrong answers correctly rejected');

console.log('\nshort answers accept their own accepted strings');
let shortOk = 0;
for (const q of ALL_QUESTIONS.filter((x) => x.type === 'short')) {
  for (const accepted of q.answer) {
    let got = null;
    const card = questionCard(q, { onAnswer: (r) => { got = r; } });
    card.el.querySelectorAll('input')[0].value = accepted;
    card.el.querySelectorAll('.btn')[0].click();
    if (!got?.correct) { failures++; console.log('  FAIL  ' + q.id + ' rejects "' + accepted + '"'); }
    else shortOk++;
  }
}
console.log('  ok    ' + shortOk + ' accepted short-answer strings validate');

console.log('\nboot');
const appRoot = new Element('div');
appRoot.setAttribute('id', 'app');
document.body.append(appRoot);
try { await import(base + '/main.js'); console.log('  ok    main.js boots and renders the shell'); }
catch (e) { failures++; console.log('  FAIL  main.js boot :: ' + e.message + '\n' + e.stack); }

console.log(failures ? '\n' + failures + ' FAILURE(S)' : '\nAll smoke checks passed.');
process.exit(failures ? 1 : 0);
