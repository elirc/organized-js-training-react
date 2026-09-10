/**
 * A trimmed-down SM-2 spaced repetition scheduler.
 *
 * Each card keeps an ease factor, an interval in days and a due date.
 * Grade scale (same idea as Anki):
 *   0 = missed it   1 = hard   2 = good   3 = easy
 */

const DAY = 86400000;

export function newCard(now = Date.now()) {
  return { ease: 2.5, interval: 0, reps: 0, lapses: 0, due: now };
}

export function schedule(card, grade, now = Date.now()) {
  const next = { ...(card || newCard(now)) };

  if (grade === 0) {
    next.lapses += 1;
    next.reps = 0;
    next.interval = 0;
    next.ease = Math.max(1.3, next.ease - 0.2);
    next.due = now + 10 * 60000; // try again in ten minutes
    return next;
  }

  next.reps += 1;
  if (next.reps === 1) next.interval = grade === 3 ? 3 : 1;
  else if (next.reps === 2) next.interval = grade === 1 ? 3 : 6;
  else next.interval = Math.round(next.interval * next.ease * (grade === 1 ? 0.6 : 1));

  next.ease = clampEase(next.ease + (grade === 3 ? 0.15 : grade === 1 ? -0.15 : 0));
  next.interval = Math.min(next.interval, 180);
  next.due = now + next.interval * DAY;
  return next;
}

function clampEase(value) {
  return Math.min(3.0, Math.max(1.3, Number(value.toFixed(2))));
}

export function isDue(card, now = Date.now()) {
  return !card || card.due <= now;
}

/** Human label: "due now", "in 3d", "in 2w". */
export function dueLabel(card, now = Date.now()) {
  if (isDue(card, now)) return 'due now';
  const days = Math.ceil((card.due - now) / DAY);
  if (days < 1) return 'later today';
  if (days < 14) return `in ${days}d`;
  return `in ${Math.round(days / 7)}w`;
}
