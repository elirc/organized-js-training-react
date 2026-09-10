import { h, mount, inline, code as codeBlock } from '../lib/dom.js';
import { TRACKS } from '../content/index.js';
import { normalizeAnswer } from '../lib/util.js';

/**
 * Every lesson on one page, with a live filter. This is the page to skim on
 * the train an hour before the interview.
 */
export default function referenceView() {
  const results = h('div');
  const search = h('input.short-input', {
    type: 'search',
    placeholder: 'Filter everything… try "closure", "index", "DI lifetime", "CORS"',
    style: { marginTop: '0' },
    onInput: () => render(search.value),
  });

  function render(term) {
    const needle = normalizeAnswer(term);
    const blocks = [];

    for (const track of TRACKS) {
      const modules = track.modules
        .map((module) => ({ module, lines: matchingLines(module, needle) }))
        .filter(({ lines }) => !needle || lines.length);

      if (!modules.length) continue;

      blocks.push(h('section', { id: track.id, style: { scrollMarginTop: '90px' } },
        h('div.section-title',
          h('h2', { style: { color: track.color } }, track.name),
          h('span.hint', `${track.modules.length} modules`),
        ),
        h('div.stack', modules.map(({ module, lines }) => moduleBlock(module, needle, lines))),
      ));
    }

    mount(results, blocks.length ? blocks : h('div.empty',
      h('span.ico', '🔍'),
      h('p', `Nothing matches “${term}”.`),
    ));
  }

  function moduleBlock(module, needle, lines) {
    const lesson = module.lesson ?? {};
    return h('div.card',
      h('div.row.between',
        h('h3', { style: { margin: 0 } }, module.name),
        h('a.btn.sm.ghost', { href: `#/module/${module.id}` }, 'Open'),
      ),

      needle
        ? h('ul', { style: { marginTop: '12px' } }, lines.map((line) => h('li', { html: highlight(line, needle) })))
        : h('div',
            lesson.summary ? h('p.small.muted', { style: { marginTop: '10px' } }, lesson.summary) : null,
            lesson.bullets?.length
              ? h('ul', { style: { fontSize: '.93rem' } }, lesson.bullets.map((b) => h('li', { html: inline(b) })))
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
    );
  }

  const view = h('main',
    h('div.page-head',
      h('div.eyebrow', 'Cheat sheets'),
      h('h1', 'Everything, on one page'),
      h('p.lede', 'Every lesson summary, trap and "asked as" prompt in the app. Filter it, skim it, or use it to find which module to revisit.'),
      search,
    ),
    h('div.ref-layout',
      h('nav.ref-toc',
        h('div.tiny.faint', { style: { padding: '0 10px 6px', textTransform: 'uppercase', letterSpacing: '.08em' } }, 'Jump to'),
        TRACKS.map((t) => h('a', { href: `#/reference#${t.id}`, onClick: (e) => {
          e.preventDefault();
          document.getElementById(t.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } }, t.name)),
      ),
      results,
    ),
  );

  render('');

  // Support #/reference#javascript deep links.
  const anchor = location.hash.split('#')[2];
  if (anchor) queueMicrotask(() => document.getElementById(anchor)?.scrollIntoView({ block: 'start' }));

  return view;
}

function matchingLines(module, needle) {
  if (!needle) return [];
  const lesson = module.lesson ?? {};
  const pool = [
    lesson.summary,
    ...(lesson.bullets ?? []),
    ...(lesson.gotchas ?? []),
    ...(lesson.interview ?? []),
    ...module.questions.map((q) => q.prompt),
  ].filter(Boolean);
  return pool.filter((line) => normalizeAnswer(line).includes(needle));
}

function highlight(line, needle) {
  const html = inline(line);
  if (!needle) return html;
  const safe = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(new RegExp(`(${safe})`, 'ig'), '<mark style="background:#3a4a2a;color:#d9f99d;border-radius:3px">$1</mark>');
}
