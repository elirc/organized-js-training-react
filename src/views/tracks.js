import { h } from '../lib/dom.js';
import { TRACKS, TOTALS, getTrack } from '../content/index.js';
import * as store from '../lib/store.js';
import { TIERS } from '../lib/util.js';
import { trackCard } from './home.js';

export function tracksView() {
  return h('main',
    h('div.page-head',
      h('div.eyebrow', 'Learning path'),
      h('h1', 'Nine tracks, four tiers'),
      h('p.lede', `Work down a track or across a tier - the question bank is shared, so progress counts either way. ${TOTALS.questions} questions in total, and every one of them ends with an explanation you can repeat in an interview.`),
    ),
    h('div.grid.cols-3', TRACKS.map(trackCard)),
  );
}

export function trackView({ id }) {
  const track = getTrack(id);
  if (!track) return notFound();

  const mastery = store.trackMastery(track);
  const state = store.getState();

  return h('main',
    h('div.page-head',
      h('div.eyebrow', h('a', { href: '#/tracks' }, '← All tracks')),
      h('div.row', { style: { gap: '14px' } },
        h('span.mark', {
          style: {
            width: '40px', height: '40px', borderRadius: '11px', display: 'grid',
            placeItems: 'center', fontWeight: '800', color: '#0a0e17',
            background: track.color, fontFamily: 'var(--mono)', fontSize: '.85rem',
          },
        }, track.mark),
        h('h1', { style: { margin: 0 } }, track.name),
      ),
      h('p.lede', { style: { marginTop: '10px' } }, track.blurb),
      h('div.row', { style: { marginTop: '16px', maxWidth: '440px' } },
        h('div.meter', { style: { flex: 1 } }, h('i', { style: { width: `${Math.round(mastery * 100)}%` } })),
        h('span.small.muted.nowrap', `${Math.round(mastery * 100)}% mastered`),
      ),
      h('div.btn-row', { style: { marginTop: '18px' } },
        h('a.btn.primary', { href: `#/quiz?tracks=${track.id}` }, 'Drill this track'),
        h('a.btn.ghost', { href: `#/reference#${track.id}` }, 'Cheat sheet'),
      ),
    ),

    h('div.stack',
      track.modules.map((module) => {
        const m = store.moduleMastery(module);
        const read = Boolean(state.lessonsRead[module.id]);
        const done = read && m >= 0.6;
        return h('a.module-row' + (done ? '.done' : ''), { href: `#/module/${module.id}` },
          h('span.idx', done ? '✓' : module.order),
          h('div.body',
            h('h3', module.name),
            h('div.meta',
              h('span', h('i', { class: `tier-dot tier-${module.tier}` }), ' ', TIERS[module.tier].name),
              h('span', `${module.questions.length} questions`),
              h('span', `~${module.minutes ?? 10} min`),
              read ? h('span.badge.good', 'lesson read') : null,
            ),
          ),
          h('div.pct',
            h('div.meter.thin', h('i', { style: { width: `${Math.round(m * 100)}%` } })),
            h('div.n', { style: { marginTop: '5px' } }, `${Math.round(m * 100)}%`),
          ),
        );
      }),
    ),
  );
}

export function notFound() {
  return h('main',
    h('div.empty',
      h('span.ico', '🧭'),
      h('h2', 'Nothing here'),
      h('p', 'That page does not exist.'),
      h('a.btn', { href: '#/' }, 'Back to the dashboard'),
    ),
  );
}
