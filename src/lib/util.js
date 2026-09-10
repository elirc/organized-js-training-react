/** Small pure helpers. No DOM, no storage - easy to reason about and to test. */

/** Fisher-Yates. Returns a new array; does not mutate the input. */
export function shuffle(list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function sample(list, n) {
  return shuffle(list).slice(0, n);
}

export function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

export function pct(part, whole) {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

/** "01:23" */
export function mmss(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** Local calendar day as YYYY-MM-DD (used for the streak counter). */
export function dayKey(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function daysBetween(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

/** Group an array into a Map keyed by the result of `keyFn`. */
export function groupBy(list, keyFn) {
  const map = new Map();
  for (const item of list) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

export function sum(list, fn = (x) => x) {
  return list.reduce((acc, item) => acc + fn(item), 0);
}

/**
 * Loose text match for short-answer questions: case/whitespace/punctuation
 * insensitive so "use strict" and "'use strict';" both count.
 */
export function normalizeAnswer(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[`'"()[\]{};.,!?]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchesAnswer(input, accepted) {
  const given = normalizeAnswer(input);
  if (!given) return false;
  return accepted.some((valid) => {
    const want = normalizeAnswer(valid);
    return given === want || (want.length > 6 && given.includes(want));
  });
}

/** Ordinal-ish label for a tier number. */
export const TIERS = {
  1: { name: 'Foundations', hint: 'Day one. No prior code required.' },
  2: { name: 'Working knowledge', hint: 'You can build a page or an endpoint.' },
  3: { name: 'Interview ready', hint: 'The junior-role screening questions.' },
  4: { name: 'Mid level', hint: 'Trade-offs, architecture and production concerns.' },
};
