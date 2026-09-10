# Stack Ladder

An interactive upskilling app that takes you from "what is a closure" to being able to hold your own in a mid-level CRUD developer interview — across **JavaScript, TypeScript, React, Node/Express, C#, .NET, SQL, HTTP and the daily toolchain**.

No algorithm puzzles. No LeetCode. Every question is the kind of thing an interviewer actually asks about a real stack, and every one ends with an explanation you can repeat out loud.

```
10 tracks · 42 modules · 226 questions · ~11 hours of lessons
```

## Run it

The app is plain ES modules with **no build step and no dependencies**, but browsers refuse to load ES modules over `file://`, so it needs a local server:

```bash
npm start          # serves on http://localhost:5173
```

Anything else that serves static files works too — `npx serve .`, `python -m http.server`, or VS Code's Live Server extension. Open `index.html` directly and the page will tell you (politely) why it cannot start.

```bash
npm test           # content integrity + renders every view + grades every question
```

## What is in it

| Mode | What it is |
| --- | --- |
| **Learning path** | Tier by tier through every track. Each module is a short lesson — summary, bullets, a code sample, the traps, and the way the topic gets phrased in interviews — followed by its questions. |
| **Custom drill** | Pick tracks, difficulty and length. Questions you have recently missed and cards that are due are weighted to come up first. |
| **Mock interview** | 12 mixed questions, 15 minutes, no lesson to fall back on. Choose a role profile (front-end, .NET back end, Node back end, full-stack) and get a scorecard broken down by track. |
| **Spaced review** | An SM-2 scheduler resurfaces each question just before you would forget it. Get it right, it comes back later; get it wrong, it comes back today. |
| **Jeopardy board** | The original project, kept as a game mode: five random tracks, five difficulty bands, right answers pay and wrong ones cost. |
| **Cheat sheets** | Every lesson, trap and "asked as" prompt on one filterable page. The thing to skim an hour before the interview. |
| **Progress** | Mastery per track and tier, weak-spot list, session history, and JSON export/import. |

### The four tiers

| Tier | Name | Meaning |
| --- | --- | --- |
| 1 | Foundations | Day one. No prior code required. |
| 2 | Working knowledge | You can build a page or an endpoint. |
| 3 | Interview ready | The junior-role screening questions. |
| 4 | Mid level | Trade-offs, architecture and production concerns. |

### The tracks

**Foundations** · **JavaScript** · **TypeScript** · **React** · **Node & Express** · **C#** · **.NET & ASP.NET Core** · **SQL & Data** · **Web & HTTP** · **Git, Build & Testing**

Progress is shared across all modes — answering a React question on the Jeopardy board advances the same mastery bar as answering it in the learning path.

## How it works

Everything is stored in `localStorage` under one versioned key. Nothing is sent anywhere, there is no account, and you can export your progress to JSON from the Progress page.

Mastery is deliberately strict: a question counts as mastered only after **two correct answers in a row**, and it drops back to zero the moment you get it wrong. The numbers stay honest.

## Project layout

```
index.html                 shell + the "you need a server" explainer
styles/app.css             design tokens and every component style
src/
  main.js                  app shell and hash router
  lib/
    dom.js                 the ~70-line h()/mount() rendering layer
    store.js               progress, XP, streaks, mastery (localStorage)
    srs.js                 SM-2 spaced repetition scheduler
    util.js                pure helpers
  components/
    question-card.js       renders and grades all five question types
  content/
    index.js               loads tracks, flattens and denormalises the bank
    <track>.js             one file per track: lessons + questions
  views/                   one file per screen
scripts/
  validate-content.mjs     checks the question bank for structural mistakes
  smoke.mjs                renders every view and grades every question in Node
```

### Adding a question

Open the relevant file in `src/content/`, find the module, and add to its `questions` array:

```js
{
  id: 'react-s-7',                 // must be unique across the whole app
  type: 'mcq',                     // mcq | multi | tf | short | flash
  prompt: 'Why does ... ?',        // `code`, **bold** and _em_ work here
  code: 'setCount(count + 1);',    // optional, with `lang`
  choices: ['...', '...'],
  answer: 1,                       // index | [indexes] | boolean | [strings] | model answer
  explain: 'Because ...',          // required — every question must teach something
}
```

Then run `npm test`. The validator will catch a duplicate id, an out-of-range answer index or a missing explanation before it reaches a learner.

### Adding a module or a track

A module needs an `id`, `name`, `tier` (1–4), `minutes`, a `lesson` (`summary`, `bullets`, optional `code`, `gotchas`, `interview`) and its `questions`. A new track is a new file in `src/content/` exporting `{ id, name, mark, color, blurb, modules }`, registered in the `TRACKS` array in `src/content/index.js`. Nothing else needs to change — every view derives its content from that array.

## History

This started as a broken Passover-themed Jeopardy MVP. The original quiz data is still in the git history at commit `a2d14bc` if you want it back.
