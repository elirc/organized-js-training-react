/**
 * Zero-dependency integrity check for the question bank.
 *
 * Run with:  npm test
 *
 * It catches the mistakes that are invisible in the UI until a learner hits
 * them: duplicate ids (which silently merge two questions' progress), answer
 * indexes pointing past the end of the choices, and missing explanations.
 */
import { TRACKS, ALL_QUESTIONS, ALL_MODULES, TOTALS } from '../src/content/index.js';

const errors = [];
const warnings = [];

const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

const VALID_TYPES = new Set(['mcq', 'multi', 'tf', 'short', 'flash']);
const seenIds = new Map();

for (const track of TRACKS) {
  if (!track.id || !track.name || !track.mark) fail(`track ${track.id}: missing id/name/mark`);
  if (!track.modules?.length) fail(`track ${track.id}: has no modules`);

  for (const module of track.modules) {
    const where = `${track.id}/${module.id}`;
    if (!module.id) fail(`${track.id}: a module has no id`);
    if (!module.name) fail(`${where}: no name`);
    if (![1, 2, 3, 4].includes(module.tier)) fail(`${where}: tier must be 1-4, got ${module.tier}`);
    if (!module.lesson?.summary) fail(`${where}: lesson has no summary`);
    if (!module.lesson?.bullets?.length) warn(`${where}: lesson has no bullets`);
    if (!module.lesson?.interview?.length) warn(`${where}: no "asked as" prompts`);
    if (module.questions.length < 4) warn(`${where}: only ${module.questions.length} questions`);

    for (const q of module.questions) {
      const at = `${where}/${q.id}`;

      if (!q.id) fail(`${where}: a question has no id`);
      if (seenIds.has(q.id)) fail(`duplicate question id "${q.id}" (also in ${seenIds.get(q.id)})`);
      seenIds.set(q.id, where);

      if (!VALID_TYPES.has(q.type)) fail(`${at}: unknown type "${q.type}"`);
      if (!q.prompt) fail(`${at}: no prompt`);
      if (!q.explain) fail(`${at}: no explanation - every question must teach something`);

      switch (q.type) {
        case 'mcq':
          if (!Array.isArray(q.choices) || q.choices.length < 2) fail(`${at}: needs at least 2 choices`);
          if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= (q.choices?.length ?? 0)) {
            fail(`${at}: answer index ${q.answer} is out of range`);
          }
          break;
        case 'multi':
          if (!Array.isArray(q.answer) || q.answer.length === 0) fail(`${at}: multi needs an array answer`);
          for (const i of q.answer ?? []) {
            if (!Number.isInteger(i) || i < 0 || i >= (q.choices?.length ?? 0)) {
              fail(`${at}: answer index ${i} is out of range`);
            }
          }
          if (q.answer?.length === q.choices?.length) warn(`${at}: every option is correct`);
          break;
        case 'tf':
          if (typeof q.answer !== 'boolean') fail(`${at}: true/false answer must be a boolean`);
          if (q.choices) warn(`${at}: tf questions do not need a choices array`);
          break;
        case 'short':
          if (!Array.isArray(q.answer) || !q.answer.length) fail(`${at}: short answer needs accepted strings`);
          break;
        case 'flash':
          if (typeof q.answer !== 'string' || q.answer.length < 40) {
            fail(`${at}: flash cards need a substantial model answer`);
          }
          break;
      }

      const ticks = (q.prompt.match(/`/g) ?? []).length;
      if (ticks % 2 !== 0) warn(`${at}: unbalanced backtick in the prompt`);
    }
  }
}

/* ---- report ---- */

const line = '─'.repeat(58);
console.log(line);
console.log(`Stack Ladder content check`);
console.log(line);
console.log(`  tracks     ${TOTALS.tracks}`);
console.log(`  modules    ${TOTALS.modules}`);
console.log(`  questions  ${TOTALS.questions}`);

const byType = {};
const byTier = {};
for (const q of ALL_QUESTIONS) {
  byType[q.type] = (byType[q.type] ?? 0) + 1;
  byTier[q.tier] = (byTier[q.tier] ?? 0) + 1;
}
console.log(`  by type    ${Object.entries(byType).map(([k, v]) => `${k}:${v}`).join('  ')}`);
console.log(`  by tier    ${Object.entries(byTier).map(([k, v]) => `T${k}:${v}`).join('  ')}`);
console.log(`  reading    ~${Math.round(TOTALS.minutes / 60)}h across ${ALL_MODULES.length} lessons`);
console.log(line);

for (const w of warnings) console.log(`  warn  ${w}`);
for (const e of errors) console.log(`  FAIL  ${e}`);

if (errors.length) {
  console.log(line);
  console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}

console.log(`  All checks passed (${warnings.length} warning(s)).`);
console.log(line);
