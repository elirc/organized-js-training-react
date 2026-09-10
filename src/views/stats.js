import { h, toast, modal, inline } from '../lib/dom.js';
import { TRACKS, ALL_QUESTIONS, TOTALS } from '../content/index.js';
import * as store from '../lib/store.js';
import { pct, mmss, TIERS } from '../lib/util.js';
import { dueLabel } from '../lib/srs.js';
import { startSession } from './quiz.js';

export default function statsView() {
  const state = store.getState();
  const acc = store.accuracy();
  const lvl = store.level();
  const weak = store.weakQuestions(ALL_QUESTIONS);
  const due = store.dueQuestions(ALL_QUESTIONS);
  const history = [...state.history].reverse().slice(0, 12);

  return h('main',
    h('div.page-head',
      h('div.eyebrow', 'Progress'),
      h('h1', 'Where you actually stand'),
      h('p.lede', 'Mastery means answering a question correctly twice in a row. It decays back to zero the moment you get it wrong, so these numbers stay honest.'),
    ),

    h('div.grid.cols-4',
      tile('Level', lvl.level, `${lvl.into} / ${lvl.need} XP`),
      tile('Total XP', lvl.xp, `${store.XP_PER_CORRECT} per correct answer`),
      tile('Accuracy', acc.seen ? `${Math.round(acc.rate * 100)}%` : '—', `${acc.correct} of ${acc.seen} answers`),
      tile('Streak', state.streak.count || 0, `best ${state.streak.best || 0} days`),
    ),

    h('div.section-title', h('h2', 'Readiness by track')),
    h('div.card',
      h('table.qa-table',
        h('thead', h('tr',
          h('th', 'Track'), h('th', 'Mastery'), h('th', 'Seen'), h('th', ''),
        )),
        h('tbody', TRACKS.map((track) => {
          const mastery = store.trackMastery(track);
          const questions = track.modules.flatMap((m) => m.questions);
          const seen = questions.filter((q) => store.isSeen(q.id)).length;
          return h('tr',
            h('td', h('strong', track.name)),
            h('td', { style: { width: '38%' } },
              h('div.meter.thin', h('i', { style: { width: `${Math.round(mastery * 100)}%` } })),
              h('div.tiny.faint', { style: { marginTop: '4px' } }, `${Math.round(mastery * 100)}%`),
            ),
            h('td', h('span.mono.small', `${seen}/${questions.length}`)),
            h('td', { style: { textAlign: 'right' } },
              h('a.btn.sm.ghost', { href: `#/quiz?tracks=${track.id}` }, 'Drill')),
          );
        })),
      ),
    ),

    h('div.section-title', h('h2', 'By tier')),
    h('div.grid.cols-4', Object.entries(TIERS).map(([tier, info]) => {
      const questions = ALL_QUESTIONS.filter((q) => q.tier === Number(tier));
      const mastered = questions.filter((q) => store.questionMastery(q.id) >= 1).length;
      return h('div.card.tight',
        h('div.row', h('i', { class: `tier-dot tier-${tier}` }), h('strong', info.name)),
        h('div.v', { style: { fontSize: '1.5rem', fontWeight: 700, marginTop: '6px' } },
          `${pct(mastered, questions.length)}%`),
        h('div.tiny.faint', `${mastered} of ${questions.length} questions mastered`),
      );
    })),

    weak.length
      ? h('div',
          h('div.section-title',
            h('h2', 'Weak spots'),
            h('span.hint', 'questions you have got wrong more than right, worst first')),
          h('div.card',
            h('div.stack', { style: { gap: '8px' } },
              weak.slice(0, 12).map((q) => {
                const entry = state.answers[q.id];
                return h('div.result-row',
                  h('span.mk', '✗'),
                  h('div', { style: { flex: 1 } },
                    h('div.q', { html: inline(q.prompt) }),
                    h('div.a',
                      h('a', { href: `#/module/${q.moduleId}` }, `${q.trackName} → ${q.moduleName}`),
                      ` · ${entry.correct} right / ${entry.wrong} wrong · ${dueLabel(state.cards[q.id])}`),
                  ),
                );
              }),
            ),
            h('div.btn-row', { style: { marginTop: '16px' } },
              h('button.btn.primary', {
                onClick: () => startSession({
                  questions: weak.slice(0, 20),
                  title: 'Weak spot drill',
                  subtitle: `${Math.min(weak.length, 20)} questions`,
                  returnTo: '#/stats',
                  mode: 'drill',
                }),
              }, 'Drill these now'),
            ),
          ))
      : null,

    h('div.section-title', h('h2', 'Session history')),
    history.length
      ? h('div.card', h('table.qa-table',
          h('thead', h('tr', h('th', 'When'), h('th', 'Session'), h('th', 'Mode'), h('th', 'Time'), h('th', 'Score'))),
          h('tbody', history.map((s) => h('tr',
            h('td', h('span.small', new Date(s.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))),
            h('td', s.title),
            h('td', h('span.badge', s.mode)),
            h('td', h('span.mono.small', mmss(s.seconds ?? 0))),
            h('td', h('span.badge' + (s.correct / s.total >= 0.7 ? '.good' : '.warn'),
              `${s.correct}/${s.total}`)),
          ))),
        ))
      : h('div.card.center.muted', 'No sessions yet.'),

    h('div.section-title', h('h2', 'Your data')),
    h('div.card',
      h('p.small.muted',
        `Everything is stored in this browser's localStorage - ${acc.unique} question records, ${due.length} due for review, `,
        `${Object.keys(state.lessonsRead).length} of ${TOTALS.modules} lessons read. Nothing is sent anywhere.`),
      h('div.btn-row',
        h('button.btn', { onClick: exportProgress }, 'Export JSON'),
        h('button.btn', { onClick: importProgress }, 'Import JSON'),
        h('button.btn.danger', { onClick: reset }, 'Reset all progress'),
      ),
    ),
  );
}

function tile(label, value, sub) {
  return h('div.stat-tile', h('div.k', label), h('div.v', value), h('div.sub', sub));
}

function exportProgress() {
  const blob = new Blob([store.exportJSON()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: `stack-ladder-progress-${new Date().toISOString().slice(0, 10)}.json` });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('Progress exported');
}

function importProgress() {
  const input = h('input', { type: 'file', accept: 'application/json', style: { display: 'none' } });
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      store.importJSON(await file.text());
      toast('Progress imported');
      location.reload();
    } catch (err) {
      toast('That file could not be read');
      console.error(err);
    }
  });
  document.body.append(input);
  input.click();
  input.remove();
}

function reset() {
  modal((close) => h('div',
    h('h2', 'Reset everything?'),
    h('p.muted', 'This clears every answer, streak, review card and XP point in this browser. It cannot be undone - export first if you might want it back.'),
    h('div.btn-row', { style: { marginTop: '18px' } },
      h('button.btn.danger', {
        onClick: () => { store.resetAll(); close(); toast('Progress cleared'); location.hash = '#/'; location.reload(); },
      }, 'Yes, delete it all'),
      h('button.btn.ghost', { onClick: close }, 'Cancel'),
    ),
  ));
}
