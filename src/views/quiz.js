import { h, mount, toast, inline } from '../lib/dom.js';
import { questionCard } from '../components/question-card.js';
import { TRACKS, ALL_QUESTIONS, selectQuestions, getQuestion } from '../content/index.js';
import * as store from '../lib/store.js';
import { shuffle, mmss, pct, groupBy, TIERS } from '../lib/util.js';
import { isDue } from '../lib/srs.js';

/* ------------------------------------------------------------------ *
 * Session plumbing
 * ------------------------------------------------------------------ */

/** The session currently being run. Held in memory - a refresh starts over. */
let pending = null;

export function startSession(config) {
  pending = {
    questions: config.shuffle === false ? config.questions : shuffle(config.questions),
    title: config.title ?? 'Practice',
    subtitle: config.subtitle ?? '',
    returnTo: config.returnTo ?? '#/',
    timeLimit: config.timeLimit ?? null,
    mode: config.mode ?? 'practice',
  };
  // Assigning the same hash does not fire hashchange, so re-render by hand
  // when a session starts another session (e.g. "retry the ones you missed").
  if (location.hash === '#/session') window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = '#/session';
}

export function hasPendingSession() {
  return pending !== null;
}

/* ------------------------------------------------------------------ *
 * Question selection
 * ------------------------------------------------------------------ */

/**
 * Weight questions so a drill focuses on what you are worst at:
 * recently wrong > due for review > never seen > already mastered.
 */
function weightOf(question, now = Date.now()) {
  const state = store.getState();
  const entry = state.answers[question.id];
  if (!entry) return 1.6;
  if (entry.lastResult === false) return 4;
  if (isDue(state.cards[question.id], now)) return 2.2;
  return Math.max(0.25, 1 - store.questionMastery(question.id));
}

export function buildDrill({ tracks, tiers, types, count = 10 }) {
  const pool = selectQuestions({ tracks, tiers, types });
  if (!pool.length) return [];
  const now = Date.now();
  return pool
    .map((q) => ({ q, score: weightOf(q, now) * (0.5 + Math.random()) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((entry) => entry.q);
}

/* ------------------------------------------------------------------ *
 * The runner
 * ------------------------------------------------------------------ */

export function sessionView() {
  if (!pending) {
    return h('main', h('div.empty',
      h('span.ico', '⏱'),
      h('h2', 'That session has ended'),
      h('p', 'Sessions live in memory, so refreshing the page clears them. Your answers were saved.'),
      h('a.btn.primary', { href: '#/quiz' }, 'Start a new drill'),
    ));
  }

  const session = pending;
  const total = session.questions.length;
  const results = [];
  let index = 0;
  let card = null;
  const startedAt = Date.now();

  const meterFill = h('i', { style: { width: '0%' } });
  const counter = h('span.count', `1 / ${total}`);
  const timerEl = h('span.timer');
  const slot = h('div');

  const el = h('main', h('div.quiz-wrap',
    h('div.row.between', { style: { marginBottom: '14px' } },
      h('div',
        h('div.eyebrow.small.faint', session.subtitle),
        h('h2', { style: { margin: 0 } }, session.title),
      ),
      h('button.btn.ghost.sm', {
        onClick: () => { if (confirm('End this session? Answers already given are saved.')) finish(true); },
      }, 'End session'),
    ),
    h('div.quiz-bar',
      h('div.meter', meterFill),
      counter,
      timerEl,
    ),
    slot,
  ));

  /* timer */
  const tick = () => {
    const elapsed = (Date.now() - startedAt) / 1000;
    if (session.timeLimit) {
      const left = session.timeLimit - elapsed;
      timerEl.textContent = mmss(left);
      timerEl.classList.toggle('low', left < 60);
      if (left <= 0) { finish(true); return; }
    } else {
      timerEl.textContent = mmss(elapsed);
    }
  };
  tick();
  const timerId = setInterval(tick, 1000);

  const onKey = (e) => card?.handleKey(e);
  document.addEventListener('keydown', onKey);

  el.cleanup = () => {
    clearInterval(timerId);
    document.removeEventListener('keydown', onKey);
  };

  function show() {
    const question = session.questions[index];
    counter.textContent = `${index + 1} / ${total}`;
    meterFill.style.width = `${pct(index, total)}%`;

    card = questionCard(question, {
      onAnswer: ({ correct, grade }) => {
        store.recordAnswer(question.id, correct, grade);
        results.push({ id: question.id, correct });
      },
      onContinue: () => {
        index += 1;
        if (index >= total) finish(false);
        else show();
      },
      continueLabel: index === total - 1 ? 'See results' : 'Next question',
    });

    mount(slot, card.el);
    el.scrollIntoView?.({ block: 'start' });
  }

  function finish(early) {
    el.cleanup();
    const elapsed = Math.round((Date.now() - startedAt) / 1000);
    const correct = results.filter((r) => r.correct).length;

    if (results.length) {
      store.recordSession({
        mode: session.mode,
        title: session.title,
        total: results.length,
        correct,
        seconds: elapsed,
      });
    }
    mount(el, resultsPanel({ session, results, correct, elapsed, early }));
  }

  show();
  return el;
}

function resultsPanel({ session, results, correct, elapsed, early }) {
  const total = results.length;
  const score = total ? Math.round((correct / total) * 100) : 0;
  const missed = results.filter((r) => !r.correct).map((r) => getQuestion(r.id));

  const verdict =
    score >= 90 ? ['Interview ready', 'good'] :
    score >= 70 ? ['Solid - tighten the misses', 'brand'] :
    score >= 50 ? ['Getting there', 'warn'] :
                  ['Worth re-reading the lesson', 'bad'];

  const byTrack = [...groupBy(results.map((r) => ({ r, q: getQuestion(r.id) })), (x) => x.q.trackName)]
    .map(([name, rows]) => ({
      name,
      total: rows.length,
      correct: rows.filter((x) => x.r.correct).length,
    }))
    .sort((a, b) => a.correct / a.total - b.correct / b.total);

  return h('div.quiz-wrap',
    h('div.card.pad-lg.center',
      early ? h('div.badge.warn', { style: { marginBottom: '12px' } }, 'Ended early') : null,
      h('div.score-ring',
        h('div.big', `${score}%`),
        h('div.muted', `${correct} of ${total} correct in ${mmss(elapsed)}`),
      ),
      h('div', { style: { marginTop: '14px' } }, h('span.badge.' + verdict[1], verdict[0])),
    ),

    byTrack.length > 1
      ? h('div.card', { style: { marginTop: '16px' } },
          h('h3', 'By track'),
          h('table.qa-table',
            h('tbody', byTrack.map((row) => h('tr',
              h('td', row.name),
              h('td', { style: { width: '45%' } },
                h('div.meter.thin', h('i', { style: { width: `${pct(row.correct, row.total)}%` } }))),
              h('td', { style: { width: '70px', textAlign: 'right' } },
                h('span.mono.small', `${row.correct}/${row.total}`)),
            ))),
          ))
      : null,

    missed.length
      ? h('div.card', { style: { marginTop: '16px' } },
          h('h3', `Review these ${missed.length}`),
          h('div.stack', { style: { gap: '8px' } },
            missed.map((q) => h('div.result-row',
              h('span.mk', '✗'),
              h('div',
                h('div.q', { html: inline(q.prompt) }),
                h('div.a', h('a', { href: `#/module/${q.moduleId}` }, `${q.trackName} → ${q.moduleName}`)),
              ),
            )),
          ))
      : h('div.card.center', { style: { marginTop: '16px' } },
          h('p', { style: { margin: 0 } }, '🎉 Clean sweep - nothing missed.')),

    h('div.btn-row', { style: { marginTop: '20px', justifyContent: 'center' } },
      missed.length
        ? h('button.btn.primary', {
            onClick: () => startSession({
              questions: missed,
              title: 'Missed questions',
              subtitle: session.title,
              returnTo: session.returnTo,
            }),
          }, `Retry the ${missed.length} you missed`)
        : null,
      h('a.btn', { href: session.returnTo }, 'Back'),
      h('a.btn.ghost', { href: '#/quiz' }, 'New drill'),
    ),
  );
}

/* ------------------------------------------------------------------ *
 * Drill setup
 * ------------------------------------------------------------------ */

const LENGTHS = [5, 10, 20, 40];

export function quizSetupView(params) {
  const selectedTracks = new Set(params.tracks ? params.tracks.split(',') : []);
  const selectedTiers = new Set(params.tiers ? params.tiers.split(',').map(Number) : []);
  let length = Number(params.count) || 10;

  const preset = params.mode;

  const countEl = h('strong');
  const startBtn = h('button.btn.primary.lg', { onClick: start });

  function pool() {
    if (preset === 'weak') return store.weakQuestions(ALL_QUESTIONS);
    return selectQuestions({
      tracks: [...selectedTracks],
      tiers: [...selectedTiers],
    });
  }

  function refresh() {
    const available = pool().length;
    countEl.textContent = String(available);
    startBtn.disabled = available === 0;
    startBtn.replaceChildren(document.createTextNode(
      available === 0 ? 'No questions match' : `Start ${Math.min(length, available)} questions`));
  }

  function start() {
    const available = pool();
    const questions = preset === 'weak'
      ? shuffle(available).slice(0, length)
      : buildDrill({ tracks: [...selectedTracks], tiers: [...selectedTiers], count: length });
    if (!questions.length) return toast('Nothing matches those filters');
    startSession({
      questions,
      title: preset === 'weak' ? 'Weak spot drill' : 'Custom drill',
      subtitle: describeFilters(selectedTracks, selectedTiers),
      returnTo: '#/quiz',
      mode: 'drill',
    });
  }

  function chip(label, on, onToggle, color) {
    const el = h('button.chip' + (on() ? '.on' : ''), {
      onClick: () => { onToggle(); el.classList.toggle('on', on()); refresh(); },
    }, color ? h('span.dot', { style: { background: color } }) : null, label);
    return el;
  }

  const view = h('main',
    h('div.page-head',
      h('div.eyebrow', 'Custom drill'),
      h('h1', preset === 'weak' ? 'Fix your weak spots' : 'Build a drill'),
      h('p.lede', preset === 'weak'
        ? 'Only questions you have answered incorrectly. They stay here until you get them right twice in a row.'
        : 'Leave a filter empty to include everything. Questions you have missed recently, and cards that are due, are weighted to come up first.'),
    ),

    preset !== 'weak' ? h('div.card',
      h('h3', 'Tracks'),
      h('div.row', { style: { marginTop: '10px' } },
        TRACKS.map((t) => chip(
          t.name,
          () => selectedTracks.has(t.id),
          () => selectedTracks.has(t.id) ? selectedTracks.delete(t.id) : selectedTracks.add(t.id),
          t.color,
        )),
      ),

      h('h3', { style: { marginTop: '22px' } }, 'Difficulty'),
      h('div.row', { style: { marginTop: '10px' } },
        Object.entries(TIERS).map(([tier, info]) => chip(
          `Tier ${tier} · ${info.name}`,
          () => selectedTiers.has(Number(tier)),
          () => selectedTiers.has(Number(tier)) ? selectedTiers.delete(Number(tier)) : selectedTiers.add(Number(tier)),
        )),
      ),
    ) : null,

    h('div.card', { style: { marginTop: '16px' } },
      h('h3', 'Length'),
      h('div.row', { style: { marginTop: '10px' } },
        LENGTHS.map((n) => {
          const el = h('button.chip' + (n === length ? '.on' : ''), {
            onClick: () => {
              length = n;
              for (const sibling of el.parentElement.children) sibling.classList.remove('on');
              el.classList.add('on');
              refresh();
            },
          }, `${n} questions`);
          return el;
        }),
      ),
    ),

    h('div.card.row.between', { style: { marginTop: '16px' } },
      h('div.muted', countEl, ' questions match your filters'),
      startBtn,
    ),
  );

  refresh();
  return view;
}

function describeFilters(tracks, tiers) {
  const parts = [];
  if (tracks.size) parts.push([...tracks].map((id) => TRACKS.find((t) => t.id === id)?.name).join(', '));
  if (tiers.size) parts.push([...tiers].map((t) => `Tier ${t}`).join(', '));
  return parts.join(' · ') || 'Everything';
}

/* ------------------------------------------------------------------ *
 * Mock interview
 * ------------------------------------------------------------------ */

export function interviewView() {
  const ROLES = [
    {
      id: 'frontend',
      name: 'Front-end (React)',
      blurb: 'JavaScript, TypeScript, React, plus the web fundamentals that always come up.',
      tracks: ['javascript', 'typescript', 'react', 'web'],
    },
    {
      id: 'backend',
      name: 'Back-end (.NET)',
      blurb: 'C#, ASP.NET Core, EF Core, SQL and API design.',
      tracks: ['csharp', 'dotnet', 'sql', 'web'],
    },
    {
      id: 'backend-node',
      name: 'Back-end (Node)',
      blurb: 'JavaScript, TypeScript, Node/Express, SQL and API design.',
      tracks: ['javascript', 'typescript', 'node', 'sql', 'web'],
    },
    {
      id: 'fullstack',
      name: 'Full-stack CRUD',
      blurb: 'A bit of everything - the realistic screening call for a junior/mid role.',
      tracks: null,
    },
  ];

  function launch(role) {
    const questions = buildDrill({
      tracks: role.tracks ?? undefined,
      tiers: [2, 3, 3, 4],
      count: 12,
    });
    startSession({
      questions,
      title: `Mock interview · ${role.name}`,
      subtitle: '12 questions · 15 minutes',
      timeLimit: 15 * 60,
      returnTo: '#/interview',
      mode: 'interview',
    });
  }

  const history = store.getState().history.filter((s) => s.mode === 'interview').slice(-5).reverse();

  return h('main',
    h('div.page-head',
      h('div.eyebrow', 'Mock interview'),
      h('h1', 'Twelve questions, fifteen minutes'),
      h('p.lede', 'Mixed difficulty, weighted towards what you have been getting wrong, with no lesson to fall back on. You get a scorecard by track at the end.'),
    ),
    h('div.grid.cols-2',
      ROLES.map((role) => h('div.card',
        h('h3', role.name),
        h('p.small.muted', role.blurb),
        h('button.btn.primary', { onClick: () => launch(role) }, 'Start'),
      )),
    ),
    history.length
      ? h('div', { style: { marginTop: '26px' } },
          h('div.section-title', h('h2', 'Previous attempts')),
          h('div.stack', { style: { gap: '8px' } },
            history.map((s) => h('div.card.tight.row.between',
              h('span.small', new Date(s.at).toLocaleString()),
              h('span.small.muted', s.title),
              h('span.badge' + (s.correct / s.total >= 0.7 ? '.good' : '.warn'),
                `${Math.round((s.correct / s.total) * 100)}%  (${s.correct}/${s.total})`),
            )),
          ))
      : null,
  );
}

/* ------------------------------------------------------------------ *
 * Spaced review
 * ------------------------------------------------------------------ */

export function reviewView() {
  const due = store.dueQuestions(ALL_QUESTIONS);

  if (!due.length) {
    const seen = store.accuracy().unique;
    return h('main', h('div.empty',
      h('span.ico', seen ? '✅' : '🌱'),
      h('h2', seen ? 'Nothing due right now' : 'No cards yet'),
      h('p', seen
        ? 'Cards come back on a spreading schedule - one day, then three, then a week, and so on. Come back tomorrow, or drill something new.'
        : 'Answer some questions and they become review cards, scheduled so they resurface just before you would forget them.'),
      h('div.btn-row', { style: { justifyContent: 'center' } },
        h('a.btn.primary', { href: '#/quiz' }, 'Start a drill'),
        h('a.btn.ghost', { href: '#/tracks' }, 'Browse tracks'),
      ),
    ));
  }

  return h('main',
    h('div.page-head',
      h('div.eyebrow', 'Spaced review'),
      h('h1', `${due.length} card${due.length === 1 ? '' : 's'} due`),
      h('p.lede', 'These are scheduled by a lightweight SM-2 algorithm: get one right and it comes back later, get it wrong and it comes back today.'),
      h('div.btn-row',
        h('button.btn.primary.lg', {
          onClick: () => startSession({
            questions: due,
            title: 'Spaced review',
            subtitle: `${due.length} due`,
            returnTo: '#/review',
            mode: 'review',
          }),
        }, 'Start review'),
      ),
    ),
    h('div.card',
      h('h3', 'What is waiting'),
      h('table.qa-table',
        h('thead', h('tr', h('th', 'Track'), h('th', 'Module'), h('th', 'Cards'))),
        h('tbody',
          [...groupBy(due, (q) => `${q.trackName}||${q.moduleName}`)]
            .map(([key, list]) => {
              const [track, module] = key.split('||');
              return h('tr', h('td', track), h('td', module), h('td', String(list.length)));
            }),
        ),
      ),
    ),
  );
}
