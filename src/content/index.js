/**
 * Loads every track, validates it, and flattens the question bank.
 *
 * Each question gets denormalised metadata (track, module, tier) so the quiz
 * engine, the board and the stats page never need to walk the tree.
 */

import foundations from './foundations.js';
import javascript from './javascript.js';
import typescript from './typescript.js';
import react from './react.js';
import node from './node.js';
import csharp from './csharp.js';
import dotnet from './dotnet.js';
import sql from './sql.js';
import web from './web.js';
import tooling from './tooling.js';

/** Display order = a sensible learning order. */
export const TRACKS = [foundations, javascript, typescript, react, node, csharp, dotnet, sql, web, tooling];

const seenIds = new Set();

for (const track of TRACKS) {
  track.questionCount = 0;
  for (const [index, module] of track.modules.entries()) {
    module.trackId = track.id;
    module.trackName = track.name;
    module.color = track.color;
    module.order = index + 1;
    module.questions ??= [];

    for (const question of module.questions) {
      if (seenIds.has(question.id)) {
        // Duplicate ids would silently merge two questions' progress.
        console.warn('[content] duplicate question id:', question.id);
      }
      seenIds.add(question.id);

      question.trackId = track.id;
      question.trackName = track.name;
      question.moduleId = module.id;
      question.moduleName = module.name;
      question.tier = question.tier ?? module.tier;
      question.color = track.color;
      question.points = question.tier * 100 + (question.type === 'flash' ? 100 : 0);
    }
    track.questionCount += module.questions.length;
  }
}

export const ALL_MODULES = TRACKS.flatMap((t) => t.modules);
export const ALL_QUESTIONS = ALL_MODULES.flatMap((m) => m.questions);

const trackById = new Map(TRACKS.map((t) => [t.id, t]));
const moduleById = new Map(ALL_MODULES.map((m) => [m.id, m]));
const questionById = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));

export const getTrack = (id) => trackById.get(id);
export const getModule = (id) => moduleById.get(id);
export const getQuestion = (id) => questionById.get(id);

export const TOTALS = {
  tracks: TRACKS.length,
  modules: ALL_MODULES.length,
  questions: ALL_QUESTIONS.length,
  minutes: ALL_MODULES.reduce((acc, m) => acc + (m.minutes ?? 10), 0),
};

/**
 * Filter the bank.
 * @param {{tracks?: string[], tiers?: number[], types?: string[]}} filters
 */
export function selectQuestions({ tracks, tiers, types } = {}) {
  return ALL_QUESTIONS.filter((q) => {
    if (tracks?.length && !tracks.includes(q.trackId)) return false;
    if (tiers?.length && !tiers.includes(q.tier)) return false;
    if (types?.length && !types.includes(q.type)) return false;
    return true;
  });
}

/** The next module a learner has not finished, walking tracks in order. */
export function nextModule(isDone) {
  const byTier = [...ALL_MODULES].sort((a, b) => a.tier - b.tier || a.order - b.order);
  return byTier.find((m) => !isDone(m)) ?? null;
}
