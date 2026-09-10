/**
 * Stack Ladder - app shell and hash router.
 *
 * No framework, no build step. `h()` in lib/dom.js is the whole rendering
 * layer; each view is a function returning a <main> element.
 */
import { h, mount } from './lib/dom.js';
import * as store from './lib/store.js';
import { ALL_QUESTIONS } from './content/index.js';

import home from './views/home.js';
import { tracksView, trackView, notFound } from './views/tracks.js';
import moduleView from './views/module.js';
import { quizSetupView, sessionView, interviewView, reviewView } from './views/quiz.js';
import boardView from './views/board.js';
import referenceView from './views/reference.js';
import statsView from './views/stats.js';

const NAV = [
  ['#/tracks', 'Path'],
  ['#/quiz', 'Drill'],
  ['#/interview', 'Interview'],
  ['#/review', 'Review'],
  ['#/board', 'Board'],
  ['#/reference', 'Reference'],
  ['#/stats', 'Progress'],
];

const ROUTES = [
  [/^\/?$/, () => home()],
  [/^\/tracks$/, () => tracksView()],
  [/^\/track\/([\w-]+)$/, (m) => trackView({ id: m[1] })],
  [/^\/module\/([\w-]+)$/, (m) => moduleView({ id: m[1] })],
  [/^\/quiz$/, (m, q) => quizSetupView(q)],
  [/^\/session$/, () => sessionView()],
  [/^\/interview$/, () => interviewView()],
  [/^\/review$/, () => reviewView()],
  [/^\/board$/, () => boardView()],
  [/^\/reference$/, () => referenceView()],
  [/^\/stats$/, () => statsView()],
];

const app = document.getElementById('app');
const viewSlot = h('div', { style: { display: 'contents' } });
let currentView = null;

/* ------------------------------------------------------------------ *
 * Header
 * ------------------------------------------------------------------ */

const xpSlot = h('div');

function renderXp() {
  const lvl = store.level();
  const state = store.getState();
  const due = store.dueQuestions(ALL_QUESTIONS).length;
  mount(xpSlot, h('div.xp-pill',
    h('span.muted', 'Lv'), h('b', String(lvl.level)),
    h('span.sep', '│'),
    h('b', String(lvl.xp)), h('span.muted', 'XP'),
    state.streak.count ? [h('span.sep', '│'), h('span', '🔥'), h('b', String(state.streak.count))] : null,
    due ? [h('span.sep', '│'), h('a', { href: '#/review', title: 'Cards due for review' }, `${due} due`)] : null,
  ));
}

function header() {
  return h('header.topbar',
    h('a.brand', { href: '#/' },
      h('span.brand-mark', '🪜'),
      h('span', 'Stack Ladder', h('small', 'noob → mid-level CRUD dev')),
    ),
    h('nav.nav', NAV.map(([href, label]) => h('a', { href, 'data-nav': href }, label))),
    xpSlot,
  );
}

function markActiveNav(path) {
  for (const link of document.querySelectorAll('[data-nav]')) {
    const target = link.getAttribute('data-nav').slice(1);
    link.classList.toggle('active', path === target || (target !== '/' && path.startsWith(target)));
  }
}

/* ------------------------------------------------------------------ *
 * Routing
 * ------------------------------------------------------------------ */

function parseHash() {
  // "#/quiz?tracks=react#anchor" -> { path: "/quiz", query: {tracks: "react"} }
  const raw = location.hash.replace(/^#/, '');
  const [beforeAnchor] = raw.split('#');
  const [path, search = ''] = beforeAnchor.split('?');
  return { path: path || '/', query: Object.fromEntries(new URLSearchParams(search)) };
}

function renderRoute() {
  const { path, query } = parseHash();

  currentView?.cleanup?.();

  let view;
  try {
    const match = ROUTES.find(([pattern]) => pattern.test(path));
    view = match ? match[1](path.match(match[0]), query) : notFound();
  } catch (err) {
    console.error('[router]', err);
    view = errorView(err);
  }

  currentView = view;
  mount(viewSlot, view);
  markActiveNav(path);
  renderXp();

  // Scroll to top on navigation, unless the view handles its own anchor.
  if (!location.hash.split('#')[2]) window.scrollTo({ top: 0 });
}

function errorView(err) {
  return h('main', h('div.card.pad-lg',
    h('h1', 'Something broke'),
    h('p.muted', 'This is a client-side app with no error reporting, so here is the raw error - the console has the stack trace.'),
    h('pre', h('code', String(err?.stack ?? err))),
    h('a.btn.primary', { href: '#/' }, 'Back to the dashboard'),
  ));
}

/* ------------------------------------------------------------------ *
 * Boot
 * ------------------------------------------------------------------ */

mount(app, header(), viewSlot);
window.addEventListener('hashchange', renderRoute);
store.subscribe(renderXp);
if (!location.hash) location.hash = '#/';
renderRoute();
