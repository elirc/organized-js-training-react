/**
 * The Jeopardy board - the original project, kept, but wired to the tech
 * question bank and to the same progress store as every other mode.
 */
import { h, mount, modal, toast } from '../lib/dom.js';
import { questionCard } from '../components/question-card.js';
import { TRACKS } from '../content/index.js';
import * as store from '../lib/store.js';
import { shuffle, sample } from '../lib/util.js';

const VALUES = [100, 200, 300, 400, 500];
const COLUMNS = 5;

/** Split a track's questions into five difficulty bands and pick one from each. */
function buildCategory(track) {
  const ranked = track.modules
    .flatMap((m) => m.questions)
    .sort((a, b) => a.tier - b.tier || a.points - b.points);
  if (ranked.length < COLUMNS) return null;

  const bandSize = ranked.length / VALUES.length;
  const used = new Set();
  const clues = VALUES.map((value, i) => {
    const start = Math.floor(i * bandSize);
    const end = Math.max(start + 1, Math.floor((i + 1) * bandSize));
    const band = ranked.slice(start, end).filter((q) => !used.has(q.id));
    const pick = (band.length ? shuffle(band) : shuffle(ranked.filter((q) => !used.has(q.id))))[0];
    used.add(pick.id);
    return { value, question: pick };
  });

  return { track, clues };
}

export default function boardView() {
  let categories = makeBoard();
  let score = 0;
  let answered = 0;

  const scoreEl = h('span');
  const boardEl = h('div.jboard');

  function makeBoard() {
    return sample(TRACKS, COLUMNS).map(buildCategory).filter(Boolean);
  }

  function renderScore() {
    scoreEl.replaceChildren(
      h('span.xp-pill',
        'Score ',
        h('b', { style: { color: score < 0 ? 'var(--bad)' : 'var(--warn)' } },
          (score < 0 ? '-$' : '$') + Math.abs(score)),
        h('span.sep', '|'),
        h('span.muted', `${answered} / ${COLUMNS * VALUES.length}`),
      ),
    );
  }

  function openClue(clue, tile) {
    let settled = false;
    const close = modal((dismiss) => {
      const card = questionCard(clue.question, {
        showSource: false,
        onAnswer: ({ correct, grade }) => {
          settled = true;
          store.recordAnswer(clue.question.id, correct, grade);
          score += correct ? clue.value : -clue.value;
          answered += 1;
          tile.disabled = true;
          tile.classList.add(correct ? 'hit' : 'miss');
          tile.textContent = correct ? `+${clue.value}` : `−${clue.value}`;
          renderScore();
          if (answered === COLUMNS * VALUES.length) setTimeout(finish, 400);
        },
        onContinue: () => dismiss(),
        continueLabel: 'Back to the board',
      });

      const onKey = (e) => card.handleKey(e);
      document.addEventListener('keydown', onKey);
      const cleanupWrap = h('div',
        h('div.row.between', { style: { marginBottom: '14px' } },
          h('span.badge.brand', clue.question.trackName),
          h('span.badge.warn', `$${clue.value}`),
        ),
        card.el,
      );
      // Remove the key handler once the modal element leaves the document.
      const observer = new MutationObserver(() => {
        if (!document.body.contains(cleanupWrap)) {
          document.removeEventListener('keydown', onKey);
          observer.disconnect();
          if (!settled) tile.disabled = false;
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      return cleanupWrap;
    });
    return close;
  }

  function finish() {
    const max = VALUES.reduce((a, b) => a + b, 0) * COLUMNS;
    modal((dismiss) => h('div.center',
      h('h2', 'Board cleared'),
      h('div.score-ring', { style: { margin: '18px 0' } },
        h('div.big', { style: { color: score < 0 ? 'var(--bad)' : 'var(--good)' } },
          (score < 0 ? '-$' : '$') + Math.abs(score)),
        h('div.muted', `out of a possible $${max}`),
      ),
      h('div.btn-row', { style: { justifyContent: 'center' } },
        h('button.btn.primary', { onClick: () => { dismiss(); newBoard(); } }, 'New board'),
        h('a.btn.ghost', { href: '#/', onClick: dismiss }, 'Done'),
      ),
    ));
  }

  function newBoard() {
    categories = makeBoard();
    score = 0;
    answered = 0;
    renderScore();
    renderBoard();
    toast('New board dealt');
  }

  function renderBoard() {
    boardEl.style.gridTemplateColumns = `repeat(${categories.length}, minmax(0, 1fr))`;
    const cells = [];

    for (const cat of categories) {
      cells.push(h('div.jhead', { style: { color: cat.track.color } }, cat.track.name));
    }
    for (let row = 0; row < VALUES.length; row++) {
      for (const cat of categories) {
        const clue = cat.clues[row];
        const tile = h('button.tile', { type: 'button' }, `$${clue.value}`);
        tile.addEventListener('click', () => { tile.disabled = true; openClue(clue, tile); });
        cells.push(tile);
      }
    }
    mount(boardEl, cells);
  }

  renderScore();
  renderBoard();

  return h('main.wide',
    h('div.row.between', { style: { marginBottom: '18px' } },
      h('div',
        h('div.eyebrow', 'Game mode'),
        h('h1', { style: { margin: 0 } }, 'Tech Jeopardy'),
        h('p.small.muted', { style: { margin: '6px 0 0' } },
          'Five random tracks, five difficulty bands. Right answers pay, wrong answers cost - and everything still counts towards your progress.'),
      ),
      h('div.row',
        scoreEl,
        h('button.btn.sm', { onClick: newBoard }, 'New board'),
      ),
    ),
    boardEl,
  );
}
