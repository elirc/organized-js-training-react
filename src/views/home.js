import { h } from '../lib/dom.js';
import { TRACKS, TOTALS, ALL_QUESTIONS, ALL_MODULES, nextModule } from '../content/index.js';
import * as store from '../lib/store.js';
import { pct, TIERS } from '../lib/util.js';

export function trackCard(track) {
  const mastery = store.trackMastery(track);
  return h('a.track-card', {
    href: `#/track/${track.id}`,
    style: { '--accent': track.color },
  },
    h('div.th',
      h('span.mark', track.mark),
      h('h3', track.name),
    ),
    h('p.blurb', track.blurb),
    h('div.meter', h('i', { style: { width: `${Math.round(mastery * 100)}%` } })),
    h('div.foot',
      h('span', `${track.modules.length} modules · ${track.questionCount} questions`),
      h('span', `${Math.round(mastery * 100)}% mastered`),
    ),
  );
}

function statTile(label, value, sub) {
  return h('div.stat-tile',
    h('div.k', label),
    h('div.v', value),
    sub ? h('div.sub', sub) : null,
  );
}

function modeCard(href, icon, title, text) {
  return h('a.mode-card', { href },
    h('span.ico', icon),
    h('h3', title),
    h('p', text),
  );
}

export default function home() {
  const state = store.getState();
  const lvl = store.level();
  const acc = store.accuracy();
  const due = store.dueQuestions(ALL_QUESTIONS).length;
  const weak = store.weakQuestions(ALL_QUESTIONS).length;

  const next = nextModule((m) => state.lessonsRead[m.id] && store.moduleMastery(m) >= 0.6);
  const started = acc.unique > 0;

  return h('main',
    h('section.hero',
      h('h1', started ? 'Welcome back.' : 'From "what is a closure" to shipping CRUD.'),
      h('p.lede', started
        ? `You are level ${lvl.level} with ${acc.unique} of ${TOTALS.questions} questions seen and ${Math.round(acc.rate * 100)}% accuracy. ${due > 0 ? `${due} card${due === 1 ? '' : 's'} are due for review.` : 'Nothing is due for review right now.'}`
        : `A guided path through JavaScript, TypeScript, React, Node, C#, .NET, SQL and the web fundamentals - built around the questions interviewers actually ask. ${TOTALS.questions} questions across ${TOTALS.modules} modules. No algorithm puzzles.`),
      h('div.btn-row',
        next
          ? h('a.btn.primary.lg', { href: `#/module/${next.id}` },
              started ? 'Continue learning' : 'Start at the beginning',
              h('span.kbd', next.trackName))
          : h('a.btn.primary.lg', { href: '#/quiz' }, 'Start a drill'),
        due > 0 ? h('a.btn.lg', { href: '#/review' }, `Review ${due} due`) : null,
        h('a.btn.ghost.lg', { href: '#/interview' }, 'Mock interview'),
      ),
    ),

    h('div.grid.cols-4',
      statTile('Level', lvl.level, `${lvl.into} / ${lvl.need} XP to next`),
      statTile('Day streak', state.streak.count || 0, `best ${state.streak.best || 0}`),
      statTile('Accuracy', started ? `${Math.round(acc.rate * 100)}%` : '—', `${acc.seen} answers given`),
      statTile('Coverage', `${pct(acc.unique, TOTALS.questions)}%`, `${acc.unique} of ${TOTALS.questions} seen`),
    ),

    h('div.section-title', h('h2', 'Ways to practise'), h('span.hint', 'all of them draw on the same question bank')),
    h('div.grid.cols-3',
      modeCard('#/tracks', '🪜', 'Learning path', 'Tier by tier through every track, with a short lesson before each set of questions.'),
      modeCard('#/quiz', '🎯', 'Custom drill', 'Pick tracks, difficulty and length. Weak spots are weighted higher.'),
      modeCard('#/interview', '🎤', 'Mock interview', '12 mixed questions against the clock, then a scorecard by topic.'),
      modeCard('#/review', '🔁', 'Spaced review', `Only what is due today. ${due} card${due === 1 ? '' : 's'} waiting.`),
      modeCard('#/board', '🟦', 'Jeopardy board', 'The original game mode, rebuilt: pick a category and a point value.'),
      modeCard('#/reference', '📓', 'Cheat sheets', 'Every lesson, gotcha and interview prompt on one searchable page.'),
    ),

    weak > 0
      ? h('div.card.tight', { style: { marginTop: '16px' } },
          h('div.row.between',
            h('div',
              h('strong', `${weak} question${weak === 1 ? '' : 's'} you have been getting wrong`),
              h('div.small.muted', 'Drill just these until they stick.'),
            ),
            h('a.btn.sm', { href: '#/quiz?mode=weak' }, 'Fix weak spots'),
          ))
      : null,

    h('div.section-title', h('h2', 'Tracks'), h('span.hint', `${TOTALS.modules} modules · roughly ${Math.round(TOTALS.minutes / 60)} hours of reading`)),
    h('div.grid.cols-3', TRACKS.map(trackCard)),

    h('div.section-title', h('h2', 'The ladder')),
    h('div.grid.cols-4',
      Object.entries(TIERS).map(([tier, info]) => {
        const modules = ALL_MODULES.filter((m) => m.tier === Number(tier));
        const done = modules.filter((m) => store.moduleMastery(m) >= 0.6).length;
        return h('div.card.tight',
          h('div.row', h('i', { class: `tier-dot tier-${tier}` }), h('strong', `Tier ${tier} · ${info.name}`)),
          h('p.small.muted', { style: { margin: '8px 0 10px' } }, info.hint),
          h('div.meter.thin', h('i', { style: { width: `${pct(done, modules.length)}%` } })),
          h('div.tiny.faint', { style: { marginTop: '6px' } }, `${done} / ${modules.length} modules mastered`),
        );
      }),
    ),
  );
}
