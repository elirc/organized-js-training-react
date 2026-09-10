/**
 * Track: JavaScript.
 *
 * Question shape:
 *   { id, type, prompt, code?, lang?, choices?, answer, explain, hint? }
 *   type: 'mcq' (answer = index) | 'multi' (answer = [indexes])
 *       | 'tf' (answer = boolean) | 'short' (answer = [accepted strings])
 *       | 'flash' (answer = model answer string, self graded)
 */
export default {
  id: 'javascript',
  name: 'JavaScript',
  mark: 'JS',
  color: '#f7df1e',
  blurb: 'The language everything else on this ladder is built on. Types, scope, closures, the event loop.',
  modules: [
    /* ------------------------------------------------------------------ */
    {
      id: 'js-values',
      name: 'Values, types and coercion',
      tier: 1,
      minutes: 12,
      lesson: {
        summary:
          'JavaScript has seven primitive types and one non-primitive type. Everything that is not a primitive is an object - including arrays, functions and dates. Most beginner bugs are really type-coercion bugs.',
        bullets: [
          'Primitives: `string`, `number`, `boolean`, `null`, `undefined`, `symbol`, `bigint`. Everything else is an `object`.',
          '`undefined` means "no value was ever assigned"; `null` means "assigned, deliberately empty".',
          'Numbers are IEEE-754 doubles. There is no separate int type, which is why `0.1 + 0.2 !== 0.3`.',
          'Use `===` (strict equality). `==` runs coercion rules almost nobody remembers correctly.',
          'Falsy values, all seven of them: `false`, `0`, `-0`, `""`, `null`, `undefined`, `NaN`. Everything else is truthy - including `[]` and `{}`.',
          '`typeof null === "object"` is a bug from 1995 that can never be fixed without breaking the web.',
        ],
        code: {
          lang: 'js',
          src: `typeof 42            // "number"
typeof "hi"          // "string"
typeof undefined     // "undefined"
typeof null          // "object"   <- the famous wart
typeof []            // "object"
typeof function(){}  // "function"

Array.isArray([])    // true  <- the correct array check

0.1 + 0.2            // 0.30000000000000004
[] == false          // true   (coercion)
[] === false         // false  (no coercion)`,
        },
        gotchas: [
          '`NaN !== NaN`. Use `Number.isNaN(x)`, never `x === NaN`.',
          '`parseInt("08")` is fine in modern engines, but always pass the radix: `parseInt(str, 10)`.',
          '`+"" === 0` and `+[] === 0`, which is how `[] == false` ends up true.',
        ],
        interview: [
          'Difference between `null` and `undefined`?',
          'Name the falsy values.',
          'Why is `0.1 + 0.2 !== 0.3` and how would you compare money safely?',
        ],
      },
      questions: [
        {
          id: 'js-values-1',
          type: 'mcq',
          prompt: 'Which of these is **not** a JavaScript primitive type?',
          choices: ['symbol', 'bigint', 'array', 'undefined'],
          answer: 2,
          explain: 'Arrays are objects. The primitives are string, number, boolean, null, undefined, symbol and bigint. Check for an array with `Array.isArray(x)`, because `typeof []` returns "object".',
        },
        {
          id: 'js-values-2',
          type: 'multi',
          prompt: 'Select every value that is **falsy**.',
          choices: ['`0`', '`"0"`', '`[]`', '`NaN`', '`""`', '`{}`'],
          answer: [0, 3, 4],
          explain: 'Only `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined` and `NaN` are falsy. `"0"`, `[]` and `{}` are all truthy objects/strings - a classic source of `if (arr)` bugs where an empty array still passes.',
        },
        {
          id: 'js-values-3',
          type: 'mcq',
          prompt: 'What does this log?',
          code: 'console.log(typeof null);',
          lang: 'js',
          choices: ['"null"', '"object"', '"undefined"', 'throws a TypeError'],
          answer: 1,
          explain: 'A bug in the first JavaScript implementation: values were tagged with a type bit pattern and the null pointer (0x00) shared the object tag. Fixing it would break too much existing code, so it stayed. To test for null use `x === null`.',
        },
        {
          id: 'js-values-4',
          type: 'mcq',
          prompt: 'A price total shows as `19.900000000000002`. What is the standard fix in a real app?',
          choices: [
            'Round with `toFixed(2)` only at display time and store money as integer cents',
            'Switch every number to `BigInt`',
            'Use `parseFloat` on every arithmetic result',
            'Set a global float precision flag',
          ],
          answer: 0,
          explain: 'Numbers are IEEE-754 binary doubles, so 0.1 has no exact representation. The industry answer is to store money as integer minor units (cents) or a decimal type on the server (`decimal` in C#, `NUMERIC` in Postgres) and format only when rendering.',
        },
        {
          id: 'js-values-5',
          type: 'short',
          prompt: 'Which function correctly tests whether a value is `NaN`? (write the call, using `x`)',
          answer: ['Number.isNaN(x)', 'Number.isNaN'],
          explain: '`Number.isNaN(x)` checks the value is actually the NaN number. The old global `isNaN(x)` coerces first, so `isNaN("abc")` is true even though the string is not NaN.',
        },
        {
          id: 'js-values-6',
          type: 'mcq',
          prompt: 'What does `"5" - 2` evaluate to, and why?',
          choices: [
            '`3` - the minus operator only works on numbers, so the string is coerced',
            '`"52"` - strings concatenate',
            '`NaN` - you cannot subtract from a string',
            'A TypeError',
          ],
          answer: 0,
          explain: '`-`, `*`, `/` and `%` always coerce to number. Only `+` is overloaded: if either side is a string it concatenates, so `"5" + 2 === "52"` while `"5" - 2 === 3`. This asymmetry is a favourite interview trick.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'js-scope',
      name: 'Scope, closures, hoisting and this',
      tier: 2,
      minutes: 16,
      lesson: {
        summary:
          'Scope decides which variables a piece of code can see. Closures are what happen when a function outlives the scope it was created in - and they are the single most asked JavaScript interview topic.',
        bullets: [
          '`var` is function-scoped and hoisted as `undefined`. `let`/`const` are block-scoped and sit in the "temporal dead zone" until the declaration runs.',
          '`const` prevents **reassignment**, not mutation. `const a = []; a.push(1)` is legal.',
          'A **closure** is a function plus a reference to the variables in the scope where it was defined.',
          'Regular functions get `this` from **how they are called**. Arrow functions do not have their own `this` - they read it from the enclosing scope lexically.',
          '`function` declarations are fully hoisted; `const fn = () => {}` is not.',
        ],
        code: {
          lang: 'js',
          src: `function makeCounter() {
  let count = 0;                 // captured by the closure
  return () => ++count;          // still alive after makeCounter returns
}
const next = makeCounter();
next(); // 1
next(); // 2

// The classic loop bug:
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 3 3 3
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 0 1 2`,
        },
        gotchas: [
          'Losing `this`: `const f = obj.method; f()` - `this` is now undefined (strict) or the global object.',
          'Arrow functions must never be used as object methods when you need `this`, or as constructors.',
          'Reading a `let` before its declaration throws a ReferenceError, it does not give you `undefined`.',
        ],
        interview: [
          'What is a closure and where have you used one?',
          'Explain the `var` vs `let` setTimeout loop output.',
          'How do arrow functions change `this`?',
        ],
      },
      questions: [
        {
          id: 'js-scope-1',
          type: 'mcq',
          prompt: 'What does this print?',
          code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}`,
          lang: 'js',
          choices: ['0 1 2', '3 3 3', '0 0 0', 'nothing'],
          answer: 1,
          explain: '`var` creates **one** function-scoped binding. All three callbacks close over that same `i`, and they run after the loop has finished, when `i` is 3. Swapping to `let` gives each iteration its own binding, printing 0 1 2.',
        },
        {
          id: 'js-scope-2',
          type: 'mcq',
          prompt: 'What happens here?',
          code: `console.log(a);
console.log(b);
var a = 1;
let b = 2;`,
          lang: 'js',
          choices: [
            '`undefined` then a ReferenceError',
            '`undefined` then `undefined`',
            'Two ReferenceErrors',
            '`1` then `2`',
          ],
          answer: 0,
          explain: '`var a` is hoisted and initialised to `undefined`. `let b` is hoisted too but stays uninitialised in the temporal dead zone, so touching it before the declaration throws `ReferenceError: Cannot access "b" before initialization`.',
        },
        {
          id: 'js-scope-3',
          type: 'tf',
          prompt: '`const` makes the value it points at immutable.',
          answer: false,
          explain: 'It only makes the **binding** constant - you cannot reassign the variable. `const user = {}; user.name = "Ada"` is perfectly legal. For real immutability you need `Object.freeze()` (shallow) or a structural-sharing library.',
        },
        {
          id: 'js-scope-4',
          type: 'mcq',
          prompt: 'What does `this.value` print?',
          code: `const counter = {
  value: 42,
  getRegular() { return this.value; },
  getArrow: () => this.value,
};
console.log(counter.getRegular(), counter.getArrow());`,
          lang: 'js',
          choices: ['42 42', '42 undefined', 'undefined 42', 'both throw'],
          answer: 1,
          explain: 'A method called as `counter.getRegular()` gets `this === counter`. The arrow function has no `this` of its own; it captures the `this` of the surrounding module/script scope, which is not the object. Rule of thumb: object methods = regular functions, callbacks inside methods = arrows.',
        },
        {
          id: 'js-scope-5',
          type: 'flash',
          prompt: 'Explain what a closure is and give one place you use one every day.',
          answer: 'A closure is a function bundled with a reference to the lexical scope it was created in, so it keeps access to those variables after the outer function returns. Everyday uses: a `useState` setter in React, an event handler that remembers the item it was created for, a debounce/throttle wrapper holding its timer id, a module that hides private state behind returned functions.',
          explain: 'Interviewers want to hear "function + remembered scope" and one concrete example. Memory note: a closure keeps its captured variables alive, which is how you accidentally leak a huge object by capturing it in a long-lived handler.',
        },
        {
          id: 'js-scope-6',
          type: 'mcq',
          prompt: 'Which call pattern leaves `this` undefined in strict mode (which modules always are)?',
          choices: [
            '`obj.method()`',
            '`const m = obj.method; m()`',
            '`obj.method.call(obj)`',
            '`new Thing()`',
          ],
          answer: 1,
          explain: 'Detaching a method loses the receiver - this is why React class components needed `this.handleClick = this.handleClick.bind(this)` in the constructor. Fixes: `.bind(obj)`, an arrow wrapper `() => obj.method()`, or class fields.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'js-collections',
      name: 'Objects, arrays and copying',
      tier: 2,
      minutes: 14,
      lesson: {
        summary:
          'Day-to-day CRUD work is mostly reshaping arrays of objects. Knowing which array methods mutate and which return a new array is what separates a smooth code review from a painful one.',
        bullets: [
          'Non-mutating: `map`, `filter`, `slice`, `concat`, `reduce`, `find`, `flatMap`, `toSorted`, `toReversed`.',
          'Mutating: `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`, `fill`.',
          '`sort()` mutates **and** compares as strings by default: `[10, 9].sort()` gives `[10, 9]`. Always pass a comparator for numbers.',
          'Spread (`{...obj}`, `[...arr]`) is a **shallow** copy: nested objects are still shared references.',
          'Deep copy without a library: `structuredClone(value)`.',
          'Optional chaining `a?.b?.c` and nullish coalescing `x ?? fallback` remove most defensive `if` blocks. `??` only falls back on `null`/`undefined`, unlike `||`.',
        ],
        code: {
          lang: 'js',
          src: `const users = [
  { id: 1, name: 'Ada', active: true,  score: 90 },
  { id: 2, name: 'Linus', active: false, score: 70 },
];

// the three you will use constantly
const names  = users.map(u => u.name);
const active = users.filter(u => u.active);
const total  = users.reduce((sum, u) => sum + u.score, 0);

// numeric sort needs a comparator, and sort mutates
const byScore = [...users].sort((a, b) => b.score - a.score);

// shallow vs deep
const shallow = { ...users[0] };
const deep    = structuredClone(users[0]);

// lookup table - O(1) instead of a nested find
const byId = Object.fromEntries(users.map(u => [u.id, u]));`,
        },
        gotchas: [
          '`users.sort(...)` mutates props coming from React state. Copy first: `[...users].sort(...)`.',
          '`Object.keys` only returns own enumerable string keys - not inherited ones, not symbols.',
          '`arr.includes(NaN)` is true but `arr.indexOf(NaN)` is -1.',
        ],
        interview: [
          'Difference between `map` and `forEach`?',
          'How do you deep clone an object?',
          'What does `[1, 5, 10].sort()` return and why?',
        ],
      },
      questions: [
        {
          id: 'js-coll-1',
          type: 'mcq',
          prompt: 'What does `[1, 5, 10, 2].sort()` return?',
          choices: ['`[1, 2, 5, 10]`', '`[1, 10, 2, 5]`', '`[10, 5, 2, 1]`', 'A TypeError'],
          answer: 1,
          explain: 'With no comparator, `sort` converts each element to a string and sorts lexicographically, so "10" comes before "2". Always write `sort((a, b) => a - b)` for numbers.',
        },
        {
          id: 'js-coll-2',
          type: 'mcq',
          prompt: 'Which pair correctly describes `map` vs `forEach`?',
          choices: [
            '`map` returns a new array; `forEach` returns `undefined` and is for side effects',
            'They are identical, `map` is just newer',
            '`forEach` is faster because it does not allocate a callback',
            '`map` mutates the original array in place',
          ],
          answer: 0,
          explain: 'Using `forEach` where you meant `map` (and getting `undefined`) is one of the most common junior bugs. In a React render you almost always want `map`, because you need the array of elements back.',
        },
        {
          id: 'js-coll-3',
          type: 'mcq',
          prompt: 'After this code, what is `a.profile.city`?',
          code: `const a = { name: 'Ada', profile: { city: 'London' } };
const b = { ...a };
b.name = 'Grace';
b.profile.city = 'Baltimore';`,
          lang: 'js',
          choices: ['"London"', '"Baltimore"', 'undefined', 'throws'],
          answer: 1,
          explain: 'Spread copies one level. `b.profile` is the *same object* as `a.profile`, so mutating through either name is visible from both. `b.name` is fine because strings were copied by value. Use `structuredClone(a)` for a true deep copy.',
        },
        {
          id: 'js-coll-4',
          type: 'mcq',
          prompt: 'A user has `count: 0`. Which expression correctly shows `0` rather than the fallback?',
          choices: ['`user.count || "none"`', '`user.count ?? "none"`', '`user.count && "none"`', '`!!user.count`'],
          answer: 1,
          explain: '`||` falls back for every falsy value, so a legitimate `0` or `""` gets swallowed - a real bug that ships often. `??` only falls back on `null` and `undefined`.',
        },
        {
          id: 'js-coll-5',
          type: 'short',
          prompt: 'Name the built-in function that makes a **deep** copy of a plain object in modern browsers and Node.',
          answer: ['structuredClone', 'structuredClone()'],
          explain: '`structuredClone(value)` handles nested objects, Maps, Sets, Dates and cyclic references. It cannot clone functions, DOM nodes or class prototypes. The old `JSON.parse(JSON.stringify(x))` trick silently destroys `undefined`, `Date` (becomes a string), `Map`, `Set` and `NaN`.',
        },
        {
          id: 'js-coll-6',
          type: 'mcq',
          prompt: 'You need to look up an item by id thousands of times in a loop. What is the idiomatic fix?',
          choices: [
            'Call `array.find(x => x.id === id)` inside the loop',
            'Build a `Map` or object index once, then look up by key',
            'Sort the array first, then use `indexOf`',
            'Cache the array in a global variable',
          ],
          answer: 1,
          explain: '`find` is O(n) each call, so the loop is O(n*m). `new Map(items.map(i => [i.id, i]))` costs one pass and gives O(1) lookups. This exact question shows up as "how would you speed this up" in code-review interviews.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'js-async',
      name: 'Async: promises and the event loop',
      tier: 3,
      minutes: 18,
      lesson: {
        summary:
          'JavaScript runs your code on a single thread. Anything slow (network, timers, disk in Node) is handed to the host, which queues a callback to run later. Understanding the queue order is a standard mid-level screening question.',
        bullets: [
          'The **call stack** runs to completion; only when it empties does the runtime look at the queues.',
          '**Microtasks** (promise callbacks, `queueMicrotask`) drain completely before the next **macrotask** (`setTimeout`, I/O, rendering).',
          'A promise is a value that is `pending`, then either `fulfilled` or `rejected` - and it settles exactly once.',
          '`async`/`await` is syntax over promises: `await` pauses the async function and resumes it as a microtask.',
          'Run independent work in parallel with `Promise.all`. Sequential `await`s in a loop are the number one accidental slow path.',
          '`Promise.all` rejects on the first failure; `Promise.allSettled` always resolves with per-item status.',
        ],
        code: {
          lang: 'js',
          src: `console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
// 1, 4, 3, 2  - microtasks beat timers

// slow: 3 round trips one after another
for (const id of ids) results.push(await fetchUser(id));

// fast: all in flight at once
const results = await Promise.all(ids.map(fetchUser));

// always handle failure
try {
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);  // fetch does NOT throw on 404/500
  return await res.json();
} catch (err) {
  reportError(err);
}`,
        },
        gotchas: [
          '`fetch` only rejects on network failure. A 404 or 500 is a *successful* promise - you must check `res.ok`.',
          '`forEach` does not await. `arr.forEach(async x => await f(x))` returns immediately and swallows errors. Use `for...of` or `Promise.all`.',
          'An unhandled promise rejection crashes a Node process by default since Node 15.',
        ],
        interview: [
          'Walk me through the event loop / what does this snippet log?',
          'Difference between `Promise.all` and `Promise.allSettled`?',
          'How do you make N API calls concurrently but handle partial failure?',
        ],
      },
      questions: [
        {
          id: 'js-async-1',
          type: 'mcq',
          prompt: 'What is the output order?',
          code: `console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');`,
          lang: 'js',
          choices: ['A B C D', 'A D C B', 'A D B C', 'A C D B'],
          answer: 1,
          explain: 'Synchronous code first (A, D). Then the microtask queue drains entirely (C). Only then does the event loop pick up the timer macrotask (B). Even `setTimeout(fn, 0)` cannot beat a resolved promise.',
        },
        {
          id: 'js-async-2',
          type: 'mcq',
          prompt: 'Your `fetch` call to a URL returning **500** does not enter the `catch` block. Why?',
          choices: [
            'You forgot `await`',
            '`fetch` only rejects on network errors; HTTP error statuses still resolve',
            '500 responses are retried automatically',
            'You need `mode: "cors"`',
          ],
          answer: 1,
          explain: 'This surprises nearly everyone coming from axios (which does throw on non-2xx). With `fetch` you must check `if (!res.ok) throw new Error(...)` yourself. `res.ok` is true for statuses 200-299.',
        },
        {
          id: 'js-async-3',
          type: 'mcq',
          prompt: 'You must call an API for 50 ids and want them all, even if some fail. Which do you reach for?',
          choices: ['`Promise.all`', '`Promise.allSettled`', '`Promise.race`', '`Promise.any`'],
          answer: 1,
          explain: '`allSettled` resolves with `{status: "fulfilled", value}` or `{status: "rejected", reason}` per item, so one bad id does not lose the other 49. `all` rejects on the first error. `race` settles with the first result of any kind; `any` gives the first *success*.',
        },
        {
          id: 'js-async-4',
          type: 'mcq',
          prompt: 'What is wrong with this?',
          code: `ids.forEach(async (id) => {
  const user = await getUser(id);
  save(user);
});
console.log('all done');`,
          lang: 'js',
          choices: [
            'Nothing, it is correct',
            '`forEach` ignores the returned promises, so "all done" logs before any save, and rejections are unhandled',
            '`async` callbacks are not allowed in `forEach`',
            'It runs the calls sequentially, which is slow',
          ],
          answer: 1,
          explain: '`forEach` discards the return value of its callback. Use `for (const id of ids) { await ... }` for sequential work, or `await Promise.all(ids.map(async id => ...))` for concurrent work. This is one of the most common async code-review catches.',
        },
        {
          id: 'js-async-5',
          type: 'tf',
          prompt: 'A promise can move from `fulfilled` back to `pending` if you call `resolve` again.',
          answer: false,
          explain: 'Promises settle exactly once and are then immutable. Additional `resolve`/`reject` calls are silently ignored. That guarantee is why `.then` handlers attached later still fire with the stored value.',
        },
        {
          id: 'js-async-6',
          type: 'flash',
          prompt: 'A colleague says "JavaScript is single-threaded, so it cannot do two things at once." Correct them precisely.',
          answer: 'Your JavaScript *executes* on one thread, so two lines of your code never run simultaneously. But the runtime around it is not single-threaded: the browser (or libuv in Node) performs network requests, timers, file I/O and crypto on other threads, then queues callbacks for the single JS thread to pick up. So JS gets concurrency (many operations in flight) without parallelism (many JS statements at the same instant). True JS parallelism needs Web Workers or Node worker_threads, which have separate heaps and communicate by messages.',
          explain: 'The distinction between concurrency and parallelism, plus naming Web Workers / worker_threads, is exactly what a mid-level interviewer is listening for.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'js-dom',
      name: 'The DOM, events and browser storage',
      tier: 2,
      minutes: 14,
      lesson: {
        summary:
          'Even in a React job you get asked about the DOM, because React is a wrapper over it. Event delegation and the bubbling phase come up constantly.',
        bullets: [
          'Events **capture** down from `window` to the target, then **bubble** back up. Handlers run on the bubble phase unless you pass `{ capture: true }`.',
          '**Event delegation**: put one listener on a parent and read `event.target`. Works for elements added later and uses far less memory.',
          '`event.preventDefault()` stops the browser default (form submit, link navigation). `event.stopPropagation()` stops the event travelling further. They are not the same.',
          '`localStorage` persists until cleared; `sessionStorage` dies with the tab. Both are synchronous, string-only, ~5MB, and readable by any script on the origin - never put tokens you care about there.',
          '`textContent` is safe; `innerHTML` with user input is how you get XSS.',
        ],
        code: {
          lang: 'js',
          src: `// one listener for a whole list, including future rows
list.addEventListener('click', (event) => {
  const row = event.target.closest('[data-id]');
  if (!row) return;
  remove(row.dataset.id);
});

form.addEventListener('submit', (event) => {
  event.preventDefault();                 // stop the full page reload
  const data = Object.fromEntries(new FormData(form));
  save(data);
});

localStorage.setItem('theme', 'dark');    // strings only
JSON.parse(localStorage.getItem('user') ?? 'null');`,
        },
        gotchas: [
          '`localStorage` stores strings. `setItem("n", 5)` then `getItem("n")` gives `"5"`, and `"5" + 1 === "51"`.',
          'A `<button>` inside a `<form>` defaults to `type="submit"` and will reload the page. Set `type="button"`.',
          'Storage throws in some private-browsing modes - wrap it in try/catch (this app does).',
        ],
        interview: [
          'What is event delegation and why use it?',
          'Difference between `preventDefault` and `stopPropagation`?',
          'localStorage vs sessionStorage vs cookies - when would you use each?',
        ],
      },
      questions: [
        {
          id: 'js-dom-1',
          type: 'mcq',
          prompt: 'You render 500 rows and need a click handler on each. What is the recommended approach?',
          choices: [
            'Attach 500 listeners in a loop',
            'One listener on the container, then check `event.target.closest(...)`',
            'Use inline `onclick` attributes',
            'Re-attach listeners on every render',
          ],
          answer: 1,
          explain: 'That is event delegation. One listener uses less memory, survives rows being added or removed, and needs no cleanup per row. It works because events bubble up from the target to the container.',
        },
        {
          id: 'js-dom-2',
          type: 'mcq',
          prompt: 'Clicking submit reloads the whole page and loses your app state. What did you forget?',
          choices: [
            '`event.stopPropagation()`',
            '`event.preventDefault()` in the submit handler',
            '`return false` from the click handler',
            '`form.noValidate = true`',
          ],
          answer: 1,
          explain: 'The browser default for a form submit is a full navigation. `preventDefault()` cancels that default while leaving the event free to bubble. `stopPropagation()` would only stop other handlers seeing the event - the reload would still happen.',
        },
        {
          id: 'js-dom-3',
          type: 'mcq',
          prompt: 'Where should a JWT access token be stored to reduce XSS risk?',
          choices: [
            '`localStorage`, it is simplest',
            'An httpOnly, Secure, SameSite cookie set by the server',
            '`sessionStorage`, it clears on close',
            'A global JavaScript variable',
          ],
          answer: 1,
          explain: 'Anything reachable from JavaScript is readable by injected script. An `httpOnly` cookie cannot be read by JS at all. The trade-off is that cookies are sent automatically, so you then need `SameSite=Lax/Strict` and/or CSRF tokens. Interviewers love this "XSS vs CSRF" trade-off discussion.',
        },
        {
          id: 'js-dom-4',
          type: 'mcq',
          prompt: 'What does `localStorage.getItem("count")` return after `localStorage.setItem("count", 5)`?',
          choices: ['`5` (number)', '`"5"` (string)', '`null`', '`undefined`'],
          answer: 1,
          explain: 'Web Storage serialises everything to strings. Store structured data with `JSON.stringify` and read it back with `JSON.parse`. Missing keys return `null`, not `undefined`.',
        },
        {
          id: 'js-dom-5',
          type: 'tf',
          prompt: 'Setting `element.innerHTML = userComment` is safe as long as the comment came from your own database.',
          answer: false,
          explain: 'The database is just where the attacker stored the payload - that is stored XSS, the more dangerous kind. Use `textContent` for plain text, or sanitise (DOMPurify) if you must render HTML. Note React escapes by default, which is why `dangerouslySetInnerHTML` is named to scare you.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'js-modern',
      name: 'Modules and modern syntax',
      tier: 3,
      minutes: 12,
      lesson: {
        summary:
          'ES modules are the unit of code sharing in both the browser and modern Node. Knowing the ESM/CommonJS split saves you hours of "cannot use import statement outside a module".',
        bullets: [
          'ESM: `import`/`export`, static, hoisted, top-level `await` allowed. CommonJS: `require`/`module.exports`, dynamic, synchronous, Node-only.',
          'Node picks the format from `"type": "module"` in package.json, or the `.mjs` / `.cjs` file extension.',
          'One default export per module, any number of named exports. Named exports are better for refactoring and tree-shaking.',
          'Modules are singletons: importing the same file twice gives the same evaluated instance.',
          'Modules are always strict mode and have their own top-level scope (no accidental globals).',
          'Destructuring with defaults and rest is everywhere in React and Node code: `const { a = 1, ...rest } = obj`.',
        ],
        code: {
          lang: 'js',
          src: `// named + default
export function formatDate(d) { /* ... */ }
export const MAX = 10;
export default class Api { /* ... */ }

import Api, { formatDate, MAX } from './api.js';
import * as api from './api.js';

// lazy load - returns a promise, splits the bundle
const { heavy } = await import('./heavy-chart.js');

// destructuring you will write daily
function Row({ user, onSelect, compact = false, ...rest }) {}
const [first, ...others] = list;
const { data: users = [] } = response;`,
        },
        gotchas: [
          '"Cannot use import statement outside a module" = Node is treating the file as CommonJS. Add `"type": "module"`.',
          'ESM imports need the file extension (`./util.js`); bundlers hide this, plain Node does not.',
          '`import` is hoisted, so the imported module always evaluates before the importing module body.',
        ],
        interview: [
          'ESM vs CommonJS - what actually differs?',
          'Why prefer named exports?',
          'What does dynamic `import()` buy you?',
        ],
      },
      questions: [
        {
          id: 'js-mod-1',
          type: 'mcq',
          prompt: 'Node throws "Cannot use import statement outside a module". Fastest correct fix?',
          choices: [
            'Add `"type": "module"` to package.json (or rename the file to `.mjs`)',
            'Install Babel',
            'Wrap the imports in a try/catch',
            'Downgrade Node',
          ],
          answer: 0,
          explain: 'Node defaults `.js` files to CommonJS. `"type": "module"` flips the whole package to ESM; `.mjs` flips a single file. Note the reverse also applies: after switching, `require` is gone and you need `createRequire` if you truly need it.',
        },
        {
          id: 'js-mod-2',
          type: 'mcq',
          prompt: 'What is the practical advantage of named exports over a default export?',
          choices: [
            'They are faster at runtime',
            'Renames are caught by tooling and bundlers can tree-shake unused ones',
            'They allow circular imports',
            'They avoid the need for a bundler',
          ],
          answer: 1,
          explain: 'A default export can be imported under any name, so a typo or a rename slips through and unused code is harder to drop. Most style guides (and the React ecosystem increasingly) prefer named exports for exactly this.',
        },
        {
          id: 'js-mod-3',
          type: 'mcq',
          prompt: 'What does `const { data: users = [] } = response;` do?',
          choices: [
            'Creates `data` and `users` variables',
            'Reads `response.data` into a variable called `users`, defaulting to `[]` if it is `undefined`',
            'Renames the property on `response`',
            'Throws if `response.data` is missing',
          ],
          answer: 1,
          explain: 'Destructuring with rename (`:`) plus a default. The default only applies when the value is `undefined` - `null` passes straight through, which trips people up with API responses.',
        },
        {
          id: 'js-mod-4',
          type: 'tf',
          prompt: 'Importing the same module from three different files runs its top-level code three times.',
          answer: false,
          explain: 'Modules are evaluated once and cached per module specifier. That is why a module holding a database pool or a config object works as a singleton - and why mutable module-level state is shared globally, for better or worse.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'js-classics',
      name: 'Interview classics and gotchas',
      tier: 4,
      minutes: 15,
      lesson: {
        summary:
          'The greatest hits: prototypes, equality tables, debounce vs throttle, and the snippets that get pasted into screening calls.',
        bullets: [
          'Every object has a hidden `[[Prototype]]` link. Property lookup walks that chain - that is JavaScript inheritance. `class` is sugar over it.',
          '**Debounce** waits for silence then fires once (search-as-you-type). **Throttle** fires at most once per interval (scroll, resize).',
          '`==` follows a coercion table; `===` compares type then value; `Object.is` is `===` except it separates `+0`/`-0` and treats `NaN` as equal to itself.',
          'Objects and arrays compare by reference: `{} === {}` is false. This is why React state updates must produce new references.',
          '`call(thisArg, ...args)` and `apply(thisArg, argsArray)` invoke immediately; `bind` returns a new function.',
        ],
        code: {
          lang: 'js',
          src: `function debounce(fn, wait = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

function throttle(fn, interval = 300) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last < interval) return;
    last = now;
    fn(...args);
  };
}

class Animal {
  constructor(name) { this.name = name; }
  speak() { return this.name + ' makes a noise'; }
}
class Dog extends Animal {
  speak() { return super.speak() + ' (a bark)'; }
}`,
        },
        gotchas: [
          '`{} === {}` and `[] === []` are false - different references.',
          '`0.1 + 0.2 === 0.3` is false; compare with an epsilon.',
          '`typeof NaN === "number"`, which is technically correct and always startling.',
        ],
        interview: [
          'Implement debounce.',
          'Explain prototypal inheritance.',
          'What is the difference between `call`, `apply` and `bind`?',
        ],
      },
      questions: [
        {
          id: 'js-cls-1',
          type: 'mcq',
          prompt: 'A search box fires an API call on every keystroke. You want one call after the user stops typing. What do you use?',
          choices: ['Throttle', 'Debounce', 'A Web Worker', '`requestAnimationFrame`'],
          answer: 1,
          explain: 'Debounce resets a timer on each event and only runs after a quiet period - perfect for search-as-you-type and autosave. Throttle is for continuous streams where you want steady sampling, like scroll or resize handlers.',
        },
        {
          id: 'js-cls-2',
          type: 'mcq',
          prompt: 'Which is the real difference between `call` and `apply`?',
          choices: [
            '`call` takes arguments individually, `apply` takes them as an array',
            '`apply` is asynchronous',
            '`call` returns a new function, `apply` invokes it',
            '`apply` cannot set `this`',
          ],
          answer: 0,
          explain: 'Mnemonic: **a**pply = **a**rray, **c**all = **c**omma-separated. `bind` is the odd one out - it returns a new permanently-bound function instead of invoking. Spread syntax has made `apply` mostly obsolete: `fn(...args)`.',
        },
        {
          id: 'js-cls-3',
          type: 'mcq',
          prompt: 'What does this log?',
          code: `const a = { x: 1 };
const b = { x: 1 };
console.log(a === b, JSON.stringify(a) === JSON.stringify(b));`,
          lang: 'js',
          choices: ['true true', 'false true', 'true false', 'false false'],
          answer: 1,
          explain: 'Objects compare by reference, so two structurally identical objects are not `===`. This is the foundation of React re-render logic: a new object literal in state or props is always "changed", which is why you must not create objects inline in dependency arrays.',
        },
        {
          id: 'js-cls-4',
          type: 'mcq',
          prompt: 'What is `class` in JavaScript, under the hood?',
          choices: [
            'A brand new object model added in ES2015',
            'Syntactic sugar over constructor functions and the prototype chain',
            'A compile-time construct erased by the engine',
            'The same as a TypeScript interface',
          ],
          answer: 1,
          explain: '`class Dog extends Animal` still wires `Dog.prototype.__proto__ === Animal.prototype`. The sugar adds real benefits though: methods are non-enumerable, the body is strict mode, and calling a class without `new` throws.',
        },
        {
          id: 'js-cls-5',
          type: 'short',
          prompt: 'Which comparison method treats `NaN` as equal to `NaN` **and** distinguishes `+0` from `-0`?',
          answer: ['Object.is', 'Object.is()'],
          explain: '`Object.is(NaN, NaN)` is true and `Object.is(0, -0)` is false. React uses this algorithm (`Object.is`) to decide whether state actually changed and whether to skip a re-render.',
        },
        {
          id: 'js-cls-6',
          type: 'flash',
          prompt: 'Explain prototypal inheritance to someone who only knows classical OOP (Java, C#).',
          answer: 'In C# a class is a blueprint and objects are stamped from it; the type system is separate from the instances. In JavaScript there are only objects, and every object holds a hidden link to another object - its prototype. When you read a property, the engine checks the object, then its prototype, then that object\'s prototype, until it hits null. Methods live on the shared prototype object rather than on each instance, which is why they are shared for free. `class` syntax builds this chain for you, and `extends` simply points one prototype at another.',
          explain: 'Key phrases to land: "objects linked to other objects", "lookup walks the chain", "class is sugar over it".',
        },
      ],
    },
  ],
};
