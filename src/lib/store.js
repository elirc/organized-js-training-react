/**
 * All learner progress lives here, persisted to localStorage.
 *
 * Design notes worth stealing for a real app:
 *  - one versioned blob under one key, so migrations are possible;
 *  - every write goes through `save()`, so nothing can drift;
 *  - subscribers are notified, which is how the header XP pill stays live.
 */

import { dayKey, daysBetween, clamp } from './util.js';
import { schedule, newCard, isDue } from './srs.js';

const KEY = 'stackladder.progress.v1';
const LEGACY_KEYS = ['customJeopardy'];

const EMPTY = () => ({
  version: 1,
  createdAt: Date.now(),
  xp: 0,
  streak: { count: 0, best: 0, lastDay: null },
  /** qid -> { seen, correct, wrong, streak, lastResult, lastAt } */
  answers: {},
  /** qid -> srs card */
  cards: {},
  /** moduleId -> timestamp the lesson was read */
  lessonsRead: {},
  /** completed session summaries, newest last */
  history: [],
  settings: { timerOn: true, revealDelay: true },
});

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY();
    const parsed = JSON.parse(raw);
    return { ...EMPTY(), ...parsed, settings: { ...EMPTY().settings, ...parsed.settings } };
  } catch {
    // Corrupt or unavailable storage should never brick the app.
    return EMPTY();
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode / quota - progress simply will not persist */
  }
  for (const fn of listeners) fn(state);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState() {
  return state;
}

export function resetAll() {
  state = EMPTY();
  for (const key of LEGACY_KEYS) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
  save();
}

export function exportJSON() {
  return JSON.stringify(state, null, 2);
}

export function importJSON(text) {
  const parsed = JSON.parse(text);
  if (typeof parsed !== 'object' || parsed === null) throw new Error('Not a progress file');
  state = { ...EMPTY(), ...parsed };
  save();
}

/* ------------------------------------------------------------------ *
 * Recording answers
 * ------------------------------------------------------------------ */

export const XP_PER_CORRECT = 10;
export const XP_PER_ATTEMPT = 2;

/**
 * @param {string} qid
 * @param {boolean} correct
 * @param {number} [grade] optional explicit SRS grade (0-3)
 */
export function recordAnswer(qid, correct, grade) {
  const prev = state.answers[qid] || { seen: 0, correct: 0, wrong: 0, streak: 0 };
  const entry = {
    seen: prev.seen + 1,
    correct: prev.correct + (correct ? 1 : 0),
    wrong: prev.wrong + (correct ? 0 : 1),
    streak: correct ? prev.streak + 1 : 0,
    lastResult: correct,
    lastAt: Date.now(),
  };
  state.answers[qid] = entry;
  state.cards[qid] = schedule(state.cards[qid] || newCard(), grade ?? (correct ? 2 : 0));
  state.xp += correct ? XP_PER_CORRECT : XP_PER_ATTEMPT;
  touchStreak();
  save();
  return entry;
}

export function markLessonRead(moduleId) {
  if (!state.lessonsRead[moduleId]) {
    state.lessonsRead[moduleId] = Date.now();
    state.xp += 5;
    touchStreak();
    save();
  }
}

export function recordSession(summary) {
  state.history.push({ at: Date.now(), ...summary });
  if (state.history.length > 60) state.history = state.history.slice(-60);
  save();
}

function touchStreak() {
  const today = dayKey();
  const streak = state.streak;
  if (streak.lastDay === today) return;
  const gap = streak.lastDay ? daysBetween(streak.lastDay, today) : Infinity;
  streak.count = gap === 1 ? streak.count + 1 : 1;
  streak.best = Math.max(streak.best || 0, streak.count);
  streak.lastDay = today;
}

/* ------------------------------------------------------------------ *
 * Derived views
 * ------------------------------------------------------------------ */

/** 0..1 confidence for one question. Two clean answers in a row = mastered. */
export function questionMastery(qid) {
  const entry = state.answers[qid];
  if (!entry) return 0;
  return clamp(entry.streak / 2, 0, 1);
}

export function moduleMastery(module) {
  if (!module.questions.length) return 0;
  const total = module.questions.reduce((acc, q) => acc + questionMastery(q.id), 0);
  return total / module.questions.length;
}

export function trackMastery(track) {
  const modules = track.modules.filter((m) => m.questions.length);
  if (!modules.length) return 0;
  return modules.reduce((acc, m) => acc + moduleMastery(m), 0) / modules.length;
}

export function isSeen(qid) {
  return Boolean(state.answers[qid]);
}

export function dueQuestions(allQuestions, now = Date.now()) {
  return allQuestions.filter((q) => state.answers[q.id] && isDue(state.cards[q.id], now));
}

/** Questions answered wrong more often than right, or missed most recently. */
export function weakQuestions(allQuestions) {
  return allQuestions
    .filter((q) => {
      const entry = state.answers[q.id];
      return entry && (entry.lastResult === false || entry.wrong > entry.correct);
    })
    .sort((a, b) => (state.answers[b.id].wrong - state.answers[b.id].correct)
                  - (state.answers[a.id].wrong - state.answers[a.id].correct));
}

export function unseenQuestions(allQuestions) {
  return allQuestions.filter((q) => !state.answers[q.id]);
}

export function level() {
  // 250 XP per level, gently increasing.
  const xp = state.xp;
  let lvl = 1;
  let need = 250;
  let spent = 0;
  while (xp - spent >= need) {
    spent += need;
    lvl += 1;
    need = Math.round(need * 1.15);
  }
  return { level: lvl, into: xp - spent, need, xp };
}

export function accuracy() {
  const entries = Object.values(state.answers);
  const seen = entries.reduce((acc, e) => acc + e.seen, 0);
  const correct = entries.reduce((acc, e) => acc + e.correct, 0);
  return { seen, correct, rate: seen ? correct / seen : 0, unique: entries.length };
}

export function settings() {
  return state.settings;
}

export function setSetting(key, value) {
  state.settings[key] = value;
  save();
}
