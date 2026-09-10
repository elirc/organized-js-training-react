import { h, rich, inline, code as codeBlock } from '../lib/dom.js';
import { getModule, getTrack, ALL_MODULES } from '../content/index.js';
import * as store from '../lib/store.js';
import { TIERS } from '../lib/util.js';
import { startSession } from './quiz.js';
import { notFound } from './tracks.js';

export default function moduleView({ id }) {
  const module = getModule(id);
  if (!module) return notFound();

  const track = getTrack(module.trackId);
  store.markLessonRead(module.id);

  const lesson = module.lesson ?? {};
  const mastery = store.moduleMastery(module);
  const seen = module.questions.filter((q) => store.isSeen(q.id)).length;

  const siblings = track.modules;
  const index = siblings.findIndex((m) => m.id === module.id);
  const prev = siblings[index - 1];
  const next = siblings[index + 1] ?? nextAcrossTracks(module);

  return h('main',
    h('div.page-head',
      h('div.eyebrow', h('a', { href: `#/track/${track.id}` }, `← ${track.name}`)),
      h('h1', module.name),
      h('div.row',
        h('span.badge', h('i', { class: `tier-dot tier-${module.tier}` }), `Tier ${module.tier} · ${TIERS[module.tier].name}`),
        h('span.badge', `${module.questions.length} questions`),
        h('span.badge', `~${module.minutes ?? 10} min`),
        mastery > 0 ? h('span.badge' + (mastery >= 0.6 ? '.good' : ''), `${Math.round(mastery * 100)}% mastered`) : null,
      ),
    ),

    h('article.lesson',
      lesson.summary ? rich(lesson.summary, 'p') : null,

      lesson.bullets?.length
        ? h('ul', lesson.bullets.map((b) => h('li', { html: inline(b) })))
        : null,

      lesson.code ? codeBlock(lesson.code.src, lesson.code.lang) : null,

      lesson.gotchas?.length
        ? h('div.callout.gotcha',
            h('div.lbl', 'Traps'),
            h('ul', lesson.gotchas.map((g) => h('li', { html: inline(g) }))))
        : null,

      lesson.interview?.length
        ? h('div.callout.interview',
            h('div.lbl', 'Asked as'),
            h('ul', lesson.interview.map((q) => h('li', { html: inline(q) }))))
        : null,
    ),

    h('div.card.pad-lg', { style: { marginTop: '30px' } },
      h('div.row.between',
        h('div',
          h('h3', { style: { margin: 0 } }, 'Practise this module'),
          h('p.small.muted', { style: { margin: '4px 0 0' } },
            seen === 0
              ? `${module.questions.length} questions, with an explanation after each one.`
              : `You have seen ${seen} of ${module.questions.length}. Answers you get right twice in a row count as mastered.`),
        ),
        h('button.btn.primary.lg', {
          onClick: () => startSession({
            questions: module.questions,
            title: module.name,
            subtitle: track.name,
            returnTo: `#/module/${module.id}`,
          }),
        }, seen === 0 ? 'Start questions' : 'Practise again'),
      ),
    ),

    h('div.row.between', { style: { marginTop: '26px' } },
      prev ? h('a.btn.ghost', { href: `#/module/${prev.id}` }, '← ', prev.name) : h('span'),
      next ? h('a.btn.ghost', { href: `#/module/${next.id}` }, next.name, ' →') : h('span'),
    ),
  );
}

/** After the last module of a track, point at the next unfinished tier-appropriate module. */
function nextAcrossTracks(module) {
  const candidates = ALL_MODULES
    .filter((m) => m.id !== module.id && m.tier >= module.tier)
    .sort((a, b) => a.tier - b.tier || a.order - b.order);
  const state = store.getState();
  return candidates.find((m) => !state.lessonsRead[m.id]) ?? null;
}
