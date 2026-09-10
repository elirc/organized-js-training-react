import { h, mount, inline, rich, code as codeBlock } from '../lib/dom.js';
import { matchesAnswer, TIERS } from '../lib/util.js';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

const TYPE_LABEL = {
  mcq: 'Multiple choice',
  multi: 'Select all that apply',
  tf: 'True or false',
  short: 'Short answer',
  flash: 'Explain it',
};

/**
 * Renders one question, handles grading, and reveals the explanation.
 *
 * @param {object} question
 * @param {object} opts
 * @param {(result:{correct:boolean, grade:number}) => void} opts.onAnswer  fires once, when graded
 * @param {() => void} [opts.onContinue] adds a Continue button after the reveal
 * @param {string} [opts.continueLabel]
 * @param {boolean} [opts.showSource] show the track/module badges
 * @returns {{el: HTMLElement, handleKey: (e: KeyboardEvent) => void}}
 */
export function questionCard(question, opts = {}) {
  const {
    onAnswer,
    onContinue,
    continueLabel = 'Next question',
    showSource = true,
  } = opts;

  let graded = false;
  let picked = question.type === 'multi' ? new Set() : null;
  let inputEl = null;
  const choiceButtons = [];

  const body = h('div');
  const revealSlot = h('div');
  const el = h('div.q-card', header(), body, revealSlot);

  function header() {
    if (!showSource) return null;
    return h('div.q-meta',
      h('span.badge.brand', question.trackName),
      h('span.badge', h('i', { class: `tier-dot tier-${question.tier}` }), TIERS[question.tier].name),
      h('span.badge', TYPE_LABEL[question.type] ?? question.type),
    );
  }

  /* ---------------- rendering per type ---------------- */

  function renderBody() {
    const parts = [
      rich(question.prompt, 'div'),
      question.code ? codeBlock(question.code, question.lang) : null,
      question.hint ? h('div.q-hint', question.hint) : null,
    ];
    parts[0].className = 'q-prompt';

    if (question.type === 'mcq' || question.type === 'tf') {
      parts.push(renderChoices(labels(), (i) => grade(i)));
    } else if (question.type === 'multi') {
      parts.push(renderChoices(labels(), toggle));
      parts.push(h('div.btn-row', { style: { marginTop: '16px' } },
        h('button.btn.primary', { onClick: () => grade([...picked]) }, 'Check answer')));
    } else if (question.type === 'short') {
      inputEl = h('input.short-input', {
        type: 'text',
        placeholder: 'Type your answer…',
        autocomplete: 'off',
        spellcheck: false,
        onKeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); grade(inputEl.value); } },
      });
      parts.push(inputEl);
      parts.push(h('div.btn-row', { style: { marginTop: '14px' } },
        h('button.btn.primary', { onClick: () => grade(inputEl.value) }, 'Check answer'),
        h('button.btn.ghost', { onClick: () => grade('') }, 'Skip'),
      ));
    } else if (question.type === 'flash') {
      parts.push(h('div.btn-row', { style: { marginTop: '18px' } },
        h('button.btn.primary', { onClick: () => revealFlash() }, 'Show model answer')));
    }

    mount(body, parts);
  }

  function labels() {
    return question.type === 'tf' ? ['True', 'False'] : question.choices;
  }

  function renderChoices(list, onPick) {
    const wrap = h('div.choices', { role: question.type === 'multi' ? 'group' : 'radiogroup' });
    list.forEach((text, i) => {
      const btn = h('button.choice', {
        type: 'button',
        onClick: () => onPick(i),
      }, h('span.key', KEYS[i] ?? '·'), h('span.txt', { html: inline(text) }));
      choiceButtons.push(btn);
      wrap.append(btn);
    });
    return wrap;
  }

  function toggle(i) {
    if (graded) return;
    if (picked.has(i)) picked.delete(i);
    else picked.add(i);
    choiceButtons[i].classList.toggle('picked', picked.has(i));
  }

  /* ---------------- grading ---------------- */

  function isCorrect(given) {
    switch (question.type) {
      case 'mcq':
        return given === question.answer;
      case 'tf':
        // choice 0 = True, 1 = False
        return (given === 0) === question.answer;
      case 'multi': {
        const want = [...question.answer].sort().join(',');
        return [...given].sort().join(',') === want;
      }
      case 'short':
        return matchesAnswer(given, question.answer);
      default:
        return false;
    }
  }

  function grade(given) {
    if (graded) return;
    graded = true;
    const correct = isCorrect(given);
    paintChoices(given, correct);
    if (inputEl) inputEl.disabled = true;
    onAnswer?.({ correct, grade: correct ? 2 : 0, given });
    showReveal(correct, given);
  }

  function paintChoices(given, correct) {
    for (const btn of choiceButtons) btn.disabled = true;
    if (question.type === 'mcq') {
      choiceButtons[question.answer]?.classList.add('correct');
      if (!correct && choiceButtons[given]) choiceButtons[given].classList.add('wrong');
    } else if (question.type === 'tf') {
      const rightIndex = question.answer ? 0 : 1;
      choiceButtons[rightIndex].classList.add('correct');
      if (!correct) choiceButtons[given]?.classList.add('wrong');
    } else if (question.type === 'multi') {
      question.choices.forEach((_, i) => {
        const shouldPick = question.answer.includes(i);
        const didPick = picked.has(i);
        choiceButtons[i].classList.remove('picked');
        if (shouldPick) choiceButtons[i].classList.add('correct');
        else if (didPick) choiceButtons[i].classList.add('wrong');
      });
    }
  }

  function revealFlash() {
    if (graded) return;
    graded = true;
    mount(revealSlot, h('div.reveal',
      h('div.answer-line',
        h('div.lbl', 'A strong answer covers'),
        rich(question.answer, 'div'),
      ),
      question.explain ? h('div.explain', { html: inline(question.explain) }) : null,
      h('p.small.muted', { style: { marginTop: '14px', marginBottom: '0' } }, 'How did you do?'),
      h('div.self-grade',
        selfGradeBtn('Missed it', 0),
        selfGradeBtn('Shaky', 1),
        selfGradeBtn('Solid', 2),
        selfGradeBtn('Nailed it', 3),
      ),
    ));
  }

  function selfGradeBtn(label, gradeValue) {
    return h('button.btn' + (gradeValue >= 2 ? '.primary' : ''), {
      onClick: (e) => {
        e.currentTarget.parentElement.replaceChildren(
          h('span.badge' + (gradeValue >= 2 ? '.good' : '.warn'), 'Recorded: ' + label),
        );
        onAnswer?.({ correct: gradeValue >= 2, grade: gradeValue });
        appendContinue();
      },
    }, label);
  }

  function showReveal(correct, given) {
    const answerText = describeAnswer();
    mount(revealSlot, h('div.reveal',
      h('div.verdict' + (correct ? '.ok' : '.no'),
        h('span', correct ? '✓' : '✗'),
        h('span', correct ? 'Correct' : 'Not quite'),
      ),
      !correct && answerText
        ? h('div.answer-line', h('div.lbl', 'Answer'), rich(answerText, 'div'))
        : null,
      question.type === 'short' && !correct && given
        ? h('p.small.faint', 'You wrote: ' + given)
        : null,
      h('div.explain', { html: inline(question.explain ?? '') }),
    ));
    appendContinue();
  }

  function describeAnswer() {
    switch (question.type) {
      case 'mcq': return question.choices[question.answer];
      case 'tf': return question.answer ? 'True' : 'False';
      case 'multi': return question.answer.map((i) => question.choices[i]).join('  ·  ');
      case 'short': return question.answer[0];
      default: return null;
    }
  }

  function appendContinue() {
    if (!onContinue) return;
    const reveal = revealSlot.querySelector('.reveal') ?? revealSlot;
    reveal.append(h('div.btn-row', { style: { marginTop: '18px' } },
      h('button.btn.primary', { autofocus: true, onClick: onContinue }, continueLabel,
        h('span.kbd', 'Enter')),
    ));
  }

  /* ---------------- keyboard ---------------- */

  function handleKey(e) {
    if (e.target instanceof HTMLInputElement && e.key !== 'Enter') return;

    if (e.key === 'Enter') {
      if (graded && onContinue) {
        const btn = revealSlot.querySelector('.btn.primary');
        if (btn) { e.preventDefault(); onContinue(); }
      }
      return;
    }
    if (graded) return;

    const index = KEYS.indexOf(e.key);
    if (index === -1 || index >= choiceButtons.length) return;
    e.preventDefault();
    if (question.type === 'multi') toggle(index);
    else grade(index);
  }

  renderBody();
  return { el, handleKey, isGraded: () => graded };
}
