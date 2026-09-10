export default {
  id: 'react',
  name: 'React',
  mark: 'RE',
  color: '#61dafb',
  blurb: 'Components, hooks, keys and re-renders. The parts of React that interviews and code reviews actually focus on.',
  modules: [
    /* ------------------------------------------------------------------ */
    {
      id: 'react-model',
      name: 'The mental model',
      tier: 2,
      minutes: 14,
      lesson: {
        summary:
          'React is a function from state to UI. You describe what the screen should look like for the current state; React works out the DOM operations. Almost every React bug comes from fighting that model.',
        bullets: [
          'A component is a function that takes props and returns elements. It must be pure during render - no fetching, no DOM writes, no mutating props.',
          'JSX is sugar: `<Row id={1} />` compiles to `jsx(Row, { id: 1 })`. That is why component names must be capitalised - lowercase means a DOM tag string.',
          'Props flow **down** and are read-only. To change a parent, call a function the parent passed down.',
          'A re-render is React calling your function again. It does **not** necessarily touch the DOM - reconciliation diffs the returned tree first.',
          'React re-renders a component when its state changes, its parent re-renders, or a context it consumes changes.',
          'Strict Mode in development deliberately double-invokes renders and effects to surface impure code. It does not happen in production.',
        ],
        code: {
          lang: 'jsx',
          src: `function UserCard({ user, onSelect }) {
  return (
    <article className="card" onClick={() => onSelect(user.id)}>
      <h3>{user.name}</h3>
      {user.isAdmin && <span className="badge">admin</span>}
      <p>{user.bio ?? 'No bio yet'}</p>
    </article>
  );
}

// className, not class. htmlFor, not for. camelCase events.
// Children as a prop:
function Panel({ title, children }) {
  return <section><h2>{title}</h2>{children}</section>;
}`,
        },
        gotchas: [
          '`{count && <Badge/>}` renders a literal `0` when count is 0. Use `count > 0 && ...`.',
          'Returning multiple elements needs a wrapper or a fragment `<>...</>`.',
          'Calling a handler instead of passing it: `onClick={handle()}` runs during render. Pass `onClick={handle}`.',
        ],
        interview: [
          'What is JSX and what does it compile to?',
          'Why must component names start with a capital letter?',
          'What causes a component to re-render?',
        ],
      },
      questions: [
        {
          id: 'react-m-1',
          type: 'mcq',
          prompt: 'What does `<UserCard user={u} />` compile to?',
          choices: [
            'A string of HTML',
            'A call like `jsx(UserCard, { user: u })` returning a plain object describing the element',
            'A direct `document.createElement` call',
            'A template literal',
          ],
          answer: 1,
          explain: 'JSX produces lightweight description objects (the "React element" / virtual DOM node). React compares those trees and only then issues real DOM operations. Knowing it is *just a function call* explains why props are an object and why you can store elements in variables.',
        },
        {
          id: 'react-m-2',
          type: 'mcq',
          prompt: 'This renders a stray `0` on screen when the cart is empty. Why?',
          code: `{cart.length && <Badge count={cart.length} />}`,
          lang: 'jsx',
          choices: [
            'Badge is broken',
            '`0` is falsy so `&&` returns `0`, and React renders the number 0',
            'You need a key',
            '`cart.length` is a string',
          ],
          answer: 1,
          explain: 'React skips `false`, `null` and `undefined` but renders `0` because it is a valid text node. Write `cart.length > 0 && ...` or use a ternary. This exact bug appears in production apps constantly.',
        },
        {
          id: 'react-m-3',
          type: 'mcq',
          prompt: 'Why does Strict Mode call your component function twice in development?',
          choices: [
            'To warm up the cache',
            'To surface impure render logic and effects that are not safe to run twice',
            'It is a bug in React 18',
            'To measure performance',
          ],
          answer: 1,
          explain: 'Double-invoking makes side effects during render, or effects without cleanup, visible immediately instead of in production. It is dev-only. If your code breaks under Strict Mode, the code is wrong, not Strict Mode.',
        },
        {
          id: 'react-m-4',
          type: 'mcq',
          prompt: 'A child needs to update a value the parent owns. What is the standard React answer?',
          choices: [
            'Mutate the prop directly',
            'The parent passes a callback down; the child calls it with the new value',
            'Use a global variable',
            'Give the child a ref to the parent',
          ],
          answer: 1,
          explain: '"Lifting state up": state lives at the closest common ancestor, and children get value + onChange props. This one-way data flow is what makes React apps traceable. Props are read-only by contract - mutating them is undefined behaviour.',
        },
        {
          id: 'react-m-5',
          type: 'tf',
          prompt: 'Every re-render results in DOM updates.',
          answer: false,
          explain: 'A re-render just runs your function and produces a new element tree. React diffs it against the previous one and touches the DOM only where they differ. That is why an unnecessary re-render is usually a small cost, not a catastrophe - a useful nuance to show in interviews.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'react-state',
      name: 'State, immutability and forms',
      tier: 2,
      minutes: 18,
      lesson: {
        summary:
          'State updates are asynchronous, batched, and must be immutable. Get those three facts right and most "my UI does not update" bugs disappear.',
        bullets: [
          '`const [value, setValue] = useState(initial)`. Calling `setValue` schedules a re-render; the local `value` variable does not change until the next render.',
          'Multiple `setState` calls in one event handler are **batched** into a single re-render (React 18 batches everywhere, including in promises and timeouts).',
          'Use the **updater form** when the next value depends on the previous one: `setCount(c => c + 1)`.',
          'Never mutate. `items.push(x)` keeps the same reference so React sees no change. Use `[...items, x]`, `items.filter(...)`, `items.map(...)`.',
          '`useState(expensiveInit())` runs on every render. Pass a function instead: `useState(() => expensiveInit())` - lazy initialisation.',
          'Controlled input = value comes from state + `onChange`. Uncontrolled = the DOM owns it, read it with a ref or `FormData`.',
          '`useReducer` when several fields change together or the next state depends on an action type.',
        ],
        code: {
          lang: 'jsx',
          src: `const [count, setCount] = useState(0);

function tripleWrong() {
  setCount(count + 1);   // all three read the same stale count
  setCount(count + 1);
  setCount(count + 1);   // net effect: +1
}
function tripleRight() {
  setCount(c => c + 1);
  setCount(c => c + 1);
  setCount(c => c + 1);  // net effect: +3
}

// immutable updates on a list of objects
setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
setTodos(todos.filter(t => t.id !== id));
setTodos([...todos, newTodo]);

// nested update - copy every level you touch
setUser(u => ({ ...u, address: { ...u.address, city } }));

// controlled input
<input value={name} onChange={e => setName(e.target.value)} />`,
        },
        gotchas: [
          'Reading state right after `setState` gives the old value - it is not a variable assignment.',
          '`value={undefined}` then a real value flips an input from uncontrolled to controlled and React warns. Initialise to `""`.',
          'Derived data does not belong in state. Compute `total` during render instead of syncing it with an effect.',
        ],
        interview: [
          'Why is `setCount(count + 1)` three times only +1?',
          'Why must state updates be immutable?',
          'Controlled vs uncontrolled components?',
        ],
      },
      questions: [
        {
          id: 'react-s-1',
          type: 'mcq',
          prompt: 'Starting at 0, what is `count` after this handler runs?',
          code: `setCount(count + 1);
setCount(count + 1);
setCount(count + 1);`,
          lang: 'js',
          choices: ['3', '1', '0', 'Undefined behaviour'],
          answer: 1,
          explain: '`count` is a const captured by this render\'s closure - all three calls compute `0 + 1`. React batches them and the last write wins. The updater form `setCount(c => c + 1)` queues functions that each receive the pending value, giving 3.',
        },
        {
          id: 'react-s-2',
          type: 'mcq',
          prompt: 'You call `todos.push(newTodo); setTodos(todos);` and the list does not update. Why?',
          choices: [
            'You need to call `setTodos` twice',
            '`todos` is the same array reference, so React\'s `Object.is` check sees no change and bails out',
            '`push` is asynchronous',
            'The component is memoized',
          ],
          answer: 1,
          explain: 'React compares the previous and next state with `Object.is`. Mutation keeps the reference identical, so it skips the re-render. Immutable updates also keep `memo`, `useMemo` and time-travel debugging honest.',
        },
        {
          id: 'react-s-3',
          type: 'mcq',
          prompt: 'Which correctly toggles one todo immutably?',
          choices: [
            '`todos.find(t => t.id === id).done = true`',
            '`setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t))`',
            '`setTodos(todos.forEach(t => t.done = !t.done))`',
            '`setTodos({ ...todos, done: true })`',
          ],
          answer: 1,
          explain: '`map` returns a new array, and the spread produces a new object only for the changed row - untouched rows keep their identity, so memoized children skip re-rendering. Option 3 also fails because `forEach` returns `undefined`.',
        },
        {
          id: 'react-s-4',
          type: 'mcq',
          prompt: 'React warns "A component is changing an uncontrolled input to be controlled". Cause?',
          choices: [
            'The input has no `name`',
            'The initial state was `undefined` (or `null`) and later became a string',
            'You used `onInput` instead of `onChange`',
            'The form has no `onSubmit`',
          ],
          answer: 1,
          explain: 'With `value={undefined}` React lets the DOM own the value; once a real string arrives it takes control, and the switch loses cursor position and breaks assumptions. Always initialise text state to `""`.',
        },
        {
          id: 'react-s-5',
          type: 'mcq',
          prompt: 'You keep `items` in state and also `total` in state, synced by an effect. What should you do instead?',
          choices: [
            'Nothing, that is correct',
            'Compute `total` during render from `items` - derived values should not be state',
            'Move both into context',
            'Use `useRef` for the total',
          ],
          answer: 1,
          explain: 'Duplicated state gets out of sync and costs an extra render pass. `const total = items.reduce(...)` is simpler and always correct. Only wrap it in `useMemo` if profiling shows the calculation is genuinely expensive.',
        },
        {
          id: 'react-s-6',
          type: 'mcq',
          prompt: 'When is `useReducer` a better fit than `useState`?',
          choices: [
            'Whenever there is more than one state variable',
            'When several pieces of state change together and the transitions have names, e.g. a multi-step form or a fetch machine',
            'When state must persist across reloads',
            'It is a legacy API',
          ],
          answer: 1,
          explain: 'A reducer keeps transition logic in one testable pure function outside the component and makes invalid combinations easier to prevent. It also lets you pass a stable `dispatch` down instead of many callbacks.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'react-effects',
      name: 'Effects and data fetching',
      tier: 3,
      minutes: 18,
      lesson: {
        summary:
          '`useEffect` is for synchronising with something outside React - the network, a subscription, the document title. It is not a lifecycle hook, and most effects people write should not exist.',
        bullets: [
          '`useEffect(fn, deps)` runs after paint. `[]` = once on mount; no array = after every render; `[a, b]` = when a or b changes by `Object.is`.',
          'The returned function is the **cleanup**: it runs before the next effect and on unmount. Use it for `removeEventListener`, `clearInterval`, `abort()`, unsubscribing.',
          'Under Strict Mode effects run mount-unmount-mount in dev, so a missing cleanup shows up as a doubled request or listener.',
          'Never lie to the dependency array. Missing deps cause stale closures - the effect keeps seeing the first render\'s values.',
          'You do **not** need an effect to: transform data for rendering, handle a user event, or reset state when a prop changes (use a `key` instead).',
          'Real apps use TanStack Query / SWR / RTK Query rather than hand-rolled fetch effects: caching, dedupe, retries, stale-while-revalidate and loading states for free.',
        ],
        code: {
          lang: 'jsx',
          src: `useEffect(() => {
  const controller = new AbortController();
  let ignore = false;

  (async () => {
    try {
      const res = await fetch('/api/users/' + userId, { signal: controller.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!ignore) setUser(data);            // guard against a stale response
    } catch (err) {
      if (err.name !== 'AbortError') setError(err);
    }
  })();

  return () => { ignore = true; controller.abort(); };
}, [userId]);

// reset state when a prop changes - no effect needed
<Profile key={userId} userId={userId} />`,
        },
        gotchas: [
          'An `async` function cannot be the effect callback directly - it would return a promise where React expects a cleanup function.',
          'Object or array literals in the dependency array are new every render, so the effect runs forever.',
          'Setting state unconditionally inside an effect with no deps = infinite render loop.',
        ],
        interview: [
          'What does the dependency array do and what happens if it is wrong?',
          'How do you cancel an in-flight request when the component unmounts?',
          'Name three things people use effects for that they should not.',
        ],
      },
      questions: [
        {
          id: 'react-e-1',
          type: 'mcq',
          prompt: 'What does returning a function from `useEffect` do?',
          choices: [
            'Nothing, it is ignored',
            'Registers cleanup, run before the next effect execution and on unmount',
            'Delays the effect',
            'Makes the effect synchronous',
          ],
          answer: 1,
          explain: 'Cleanup is how you avoid leaking listeners, intervals, sockets and in-flight requests. Because it also runs *between* dependency changes, an effect that subscribes to `roomId` automatically unsubscribes from the old room.',
        },
        {
          id: 'react-e-2',
          type: 'mcq',
          prompt: 'This effect runs on an infinite loop. What is the cause?',
          code: `useEffect(() => {
  fetchData(options).then(setData);
}, [options]);

const options = { limit: 10 };`,
          lang: 'jsx',
          choices: [
            '`fetchData` is async',
            '`options` is a new object literal on every render, so the reference always differs',
            '`setData` should be in the deps',
            'The array should be empty',
          ],
          answer: 1,
          explain: 'Dependencies are compared with `Object.is`, and `{} !== {}`. Fix by moving the object outside the component, wrapping it in `useMemo`, or depending on the primitive fields (`[options.limit]`).',
        },
        {
          id: 'react-e-3',
          type: 'mcq',
          prompt: 'You type fast in a search box; an old slow response overwrites the newest results. Standard fix?',
          choices: [
            'Debounce only',
            'An `ignore` flag and/or `AbortController` in the effect cleanup so stale responses are discarded',
            'Move the fetch into `useMemo`',
            'Use `useLayoutEffect`',
          ],
          answer: 1,
          explain: 'This is the "race condition" question and it comes up often. Cleanup runs before the next effect, so flipping `ignore = true` (and aborting the request) guarantees only the latest response is applied. Debouncing reduces the problem but does not eliminate it.',
        },
        {
          id: 'react-e-4',
          type: 'multi',
          prompt: 'Which of these do **not** need a `useEffect`?',
          choices: [
            'Filtering a list for display based on a search box',
            'Subscribing to a WebSocket',
            'Resetting form state when the selected user changes',
            'Sending an analytics event when a button is clicked',
            'Syncing the document title with a prop',
          ],
          answer: [0, 2, 3],
          explain: 'Filtering is derived data - compute it in render. Resetting on prop change is best done with a `key` on the component. Event handling belongs in the handler. Subscriptions and syncing to an external system (the document title is outside React) are genuine effects.',
        },
        {
          id: 'react-e-5',
          type: 'mcq',
          prompt: 'In dev, your component fires two identical GET requests on mount. Most likely cause?',
          choices: [
            'A bug in your API client',
            'Strict Mode double-invoking the effect - which is fine, but reveals that cleanup/abort is missing',
            'The dependency array is empty',
            'React 18 disables caching',
          ],
          answer: 1,
          explain: 'It is dev-only and intentional. Idempotent GETs make it harmless, but it is a signal to add an `AbortController`. If a *mutation* fires twice, you have a real bug that would also surface on a fast double click.',
        },
        {
          id: 'react-e-6',
          type: 'mcq',
          prompt: 'Why do teams adopt TanStack Query / SWR / RTK Query instead of `useEffect` + `fetch`?',
          choices: [
            'They are faster at parsing JSON',
            'They provide caching, request dedupe, background revalidation, retries and consistent loading/error state',
            '`useEffect` cannot make network calls',
            'They remove the need for a backend',
          ],
          answer: 1,
          explain: 'Hand-rolled fetching means re-implementing cache keys, dedupe, invalidation after mutations, retry/backoff and race handling in every component. Naming one of these libraries and *why* is a strong mid-level signal.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'react-lists',
      name: 'Lists, keys and conditional rendering',
      tier: 2,
      minutes: 10,
      lesson: {
        summary:
          '"Why not index as a key" is asked in almost every React interview, and the answer reveals whether you understand reconciliation.',
        bullets: [
          'Keys tell React which element is which across renders, so it can move DOM nodes instead of rebuilding them.',
          'Keys must be **stable, unique among siblings, and derived from the data** - a database id, not the array index.',
          'Index keys break whenever the list is reordered, filtered, or has items inserted or removed at the front: state and DOM stay attached to the wrong row.',
          'Index keys are acceptable only for a static list that never reorders and whose items have no state.',
          'A changed `key` on a component unmounts the old instance and mounts a fresh one - the cleanest way to reset internal state.',
        ],
        code: {
          lang: 'jsx',
          src: `{users.map(user => <Row key={user.id} user={user} />)}

// keys go on the outermost element of the map, and on Fragments like this:
{items.map(item => (
  <Fragment key={item.id}>
    <dt>{item.term}</dt>
    <dd>{item.definition}</dd>
  </Fragment>
))}

// reset a subtree by changing its key
<EditForm key={selectedId} id={selectedId} />`,
        },
        gotchas: [
          '`key={Math.random()}` remounts every row on every render - worst of all worlds.',
          'Keys are not passed to the component; reading `props.key` gives `undefined`.',
          'Keys only need to be unique among siblings, not globally.',
        ],
        interview: [
          'What are keys for?',
          'Why is the array index a bad key?',
          'How would you reset a child component\'s state from the parent?',
        ],
      },
      questions: [
        {
          id: 'react-l-1',
          type: 'mcq',
          prompt: 'You use `key={index}` on a checkbox list. A user checks row 2, then deletes row 1. What happens?',
          choices: [
            'Nothing unusual',
            'The check mark appears to jump to the wrong row, because React reuses DOM/state by position',
            'React throws an error',
            'The whole list remounts',
          ],
          answer: 1,
          explain: 'After deletion, old index 2 becomes index 1, so React matches the old row 1 element to new row 1 and keeps its DOM state. Stable ids keep identity attached to the data instead of the position.',
        },
        {
          id: 'react-l-2',
          type: 'mcq',
          prompt: 'Keys must be unique...',
          choices: ['across the whole app', 'among siblings in the same list', 'per component type', 'per route'],
          answer: 1,
          explain: 'React only compares children within the same parent, so sibling uniqueness is enough. Two different lists can both use key "1" without any problem.',
        },
        {
          id: 'react-l-3',
          type: 'mcq',
          prompt: 'You want a form to clear itself when the selected record changes. Cleanest approach?',
          choices: [
            'A `useEffect` that calls all the setters when the id changes',
            'Pass `key={selectedId}` to the form so React remounts it',
            'Call `window.location.reload()`',
            'Move the form state to context',
          ],
          answer: 1,
          explain: 'Changing the key discards the old instance and all its state - no effect, no setter list to keep in sync, no stale field. This is the officially recommended pattern in the React docs.',
        },
        {
          id: 'react-l-4',
          type: 'tf',
          prompt: 'A component can read its own key via `props.key`.',
          answer: false,
          explain: 'React consumes `key` (and `ref`) itself; they never reach your props object. If the component needs the id, pass it again explicitly: `<Row key={id} id={id} />`.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'react-perf',
      name: 'Re-renders and performance',
      tier: 4,
      minutes: 16,
      lesson: {
        summary:
          'Know what actually causes re-renders, and reach for memoization only with a profiler open. "I would measure first" is a better interview answer than a list of hooks.',
        bullets: [
          'A parent re-rendering re-renders all its children by default, regardless of whether their props changed.',
          '`React.memo(Component)` skips a re-render when props are shallowly equal - useless if you pass new object/array/function literals every time.',
          '`useMemo(fn, deps)` caches a **value**; `useCallback(fn, deps)` caches a **function** (it is `useMemo(() => fn, deps)`).',
          'Memoization has a cost: extra comparisons and retained memory. Default to no memoization until you profile.',
          'Cheaper structural wins: lift expensive state down into a smaller component, pass elements as `children` so they are not re-created, virtualise long lists, and split routes with `React.lazy` + `Suspense`.',
          'The React DevTools Profiler (and "Highlight updates") tells you what re-rendered and why - name it in interviews.',
          'The React Compiler (React 19+) auto-memoizes, which is shifting this whole topic - worth mentioning that you know it exists.',
        ],
        code: {
          lang: 'jsx',
          src: `const Row = React.memo(function Row({ user, onSelect }) { /* ... */ });

// memo defeated: a new function identity every render
<Row user={u} onSelect={() => select(u.id)} />

// memo preserved
const handleSelect = useCallback((id) => select(id), [select]);
<Row user={u} onSelect={handleSelect} />

// context value: memoize or every consumer re-renders
const value = useMemo(() => ({ user, logout }), [user, logout]);
<AuthContext.Provider value={value}>{children}</AuthContext.Provider>

// code splitting
const Reports = React.lazy(() => import('./Reports'));
<Suspense fallback={<Spinner />}><Reports /></Suspense>`,
        },
        gotchas: [
          '`useMemo` is not a semantic guarantee - React may discard the cache. Never rely on it for correctness.',
          '`<Provider value={{ user }}>` creates a new object every render and re-renders every consumer.',
          'Wrapping everything in `useCallback` adds dependency arrays to maintain and often makes things slower.',
        ],
        interview: [
          'What causes a component to re-render?',
          '`useMemo` vs `useCallback`?',
          'How would you diagnose a slow list?',
        ],
      },
      questions: [
        {
          id: 'react-p-1',
          type: 'mcq',
          prompt: '`Row` is wrapped in `React.memo` but still re-renders every time. Most likely cause?',
          choices: [
            '`memo` only works on class components',
            'A prop is a new reference each render - an inline arrow, object or array literal',
            'The component has internal state',
            '`memo` needs a second argument',
          ],
          answer: 1,
          explain: '`memo` does a shallow compare, and `() => {} !== () => {}`. Stabilise with `useCallback`/`useMemo`, or restructure so the prop is not needed. This is *the* memo interview question.',
        },
        {
          id: 'react-p-2',
          type: 'mcq',
          prompt: 'Precisely, what is the difference between `useMemo` and `useCallback`?',
          choices: [
            '`useMemo` is for numbers, `useCallback` for strings',
            '`useMemo(fn, deps)` caches the result of calling `fn`; `useCallback(fn, deps)` caches `fn` itself - it is `useMemo(() => fn, deps)`',
            '`useCallback` runs after render',
            'They are aliases',
          ],
          answer: 1,
          explain: 'Being able to state that `useCallback(fn, d)` is literally `useMemo(() => fn, d)` is a clean signal that you understand both.',
        },
        {
          id: 'react-p-3',
          type: 'mcq',
          prompt: 'Every consumer of your `AuthContext` re-renders on every parent render. Fix?',
          choices: [
            'Wrap consumers in `React.memo`',
            'Memoize the provider `value` object with `useMemo`',
            'Move the provider lower in the tree',
            'Use `useRef` for the value',
          ],
          answer: 1,
          explain: 'Context compares the value by identity. An inline `value={{ user, logout }}` is a fresh object every render, so every consumer is notified. `useMemo` on the value (plus `useCallback` on the functions inside) fixes it. Splitting rarely-changing and often-changing data into two contexts also helps.',
        },
        {
          id: 'react-p-4',
          type: 'mcq',
          prompt: 'A table of 10,000 rows scrolls badly. Best first move?',
          choices: [
            'Wrap every cell in `React.memo`',
            'Virtualise the list so only the visible rows are in the DOM (TanStack Virtual, react-window)',
            'Switch to class components',
            'Move the data into context',
          ],
          answer: 1,
          explain: 'The cost is DOM nodes and layout, not React. Rendering ~30 visible rows instead of 10,000 is an order-of-magnitude win that no amount of memoization matches. Pagination or infinite scroll are the other legitimate answers.',
        },
        {
          id: 'react-p-5',
          type: 'flash',
          prompt: 'A teammate wants to wrap every component in `React.memo` "to make the app fast". What do you say?',
          answer: 'Memoization is not free: every memoized component pays a shallow props comparison on each parent render, keeps old props alive in memory, and forces you to stabilise every callback and object you pass down - which adds dependency arrays that go stale. It only pays off when a component is genuinely expensive to render and its props genuinely stay equal. I would open the React DevTools Profiler, find the components that actually cost time, and fix those - often by restructuring (moving state down, passing children through) rather than memoizing at all. React 19\'s compiler also automates most of this.',
          explain: 'Interviewers are testing judgement, not hook trivia. "Measure first, structure before memoize" is the answer they want.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'react-arch',
      name: 'Hooks rules, context and app structure',
      tier: 4,
      minutes: 16,
      lesson: {
        summary:
          'How a real React CRUD app is put together: routing, shared state, custom hooks, forms, and where each concern lives.',
        bullets: [
          'Rules of hooks: call them only at the top level (never in conditions, loops or nested functions) and only from components or other hooks. React matches hooks to state by call **order**.',
          'A custom hook is just a function starting with `use` that calls other hooks - the standard way to share stateful logic.',
          '`useRef` holds a mutable value that survives renders without causing one. Used for DOM nodes, timer ids, previous values, and "latest value" boxes.',
          'Context is a dependency-injection channel, not a state manager. Great for theme, auth, locale; poor for high-frequency data.',
          'Typical stack: React Router (or a framework router), TanStack Query for server state, `useState`/`useReducer` + context for UI state, Zustand/Redux Toolkit only when global client state is genuinely complex.',
          'Server state and client state are different problems - conflating them is the most common architecture mistake.',
          'Forms at scale: React Hook Form (uncontrolled, fewer re-renders) plus a Zod schema for validation shared with the API.',
        ],
        code: {
          lang: 'jsx',
          src: `function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

// error boundaries still need a class (or react-error-boundary)
<ErrorBoundary fallback={<Oops />}>
  <Routes>...</Routes>
</ErrorBoundary>`,
        },
        gotchas: [
          'A hook inside `if` changes the call order between renders - React throws "Rendered fewer hooks than expected".',
          'Mutating `ref.current` does not re-render. If the UI must update, it is state, not a ref.',
          'Putting server data in Redux means you own caching, invalidation and loading flags forever.',
        ],
        interview: [
          'What are the rules of hooks and why do they exist?',
          'When would you use context vs a state library?',
          'Have you written a custom hook? What did it do?',
        ],
      },
      questions: [
        {
          id: 'react-a-1',
          type: 'mcq',
          prompt: 'Why can hooks not be called inside an `if` statement?',
          choices: [
            'A lint rule forbids it for style reasons',
            'React identifies each hook by its call order within the component, so a changing order misaligns state',
            'Conditionals break JSX',
            'They can, as long as the condition is constant',
          ],
          answer: 1,
          explain: 'Hook state lives in an ordered list on the fiber. Skipping a `useState` on render 2 shifts every later hook onto the wrong slot - hence "Rendered fewer hooks than expected". Put the condition *inside* the hook instead.',
        },
        {
          id: 'react-a-2',
          type: 'mcq',
          prompt: 'What is `useRef` for?',
          choices: [
            'Storing state that should trigger a re-render',
            'A mutable box that persists across renders without causing one - DOM nodes, timer ids, latest values',
            'Memoizing expensive calculations',
            'Replacing context',
          ],
          answer: 1,
          explain: 'The rule of thumb: if changing it should update the screen, it is state; otherwise it is a ref. `ref.current = x` is a plain assignment with no render scheduled.',
        },
        {
          id: 'react-a-3',
          type: 'mcq',
          prompt: 'Your app caches a user list fetched from the API. Where does it belong?',
          choices: [
            'Redux, as the single source of truth',
            'A server-state library (TanStack Query / RTK Query) which owns caching, refetching and invalidation',
            'localStorage',
            'A module-level variable',
          ],
          answer: 1,
          explain: 'Server state is a *cache of someone else\'s data*: it goes stale, needs revalidation, dedupe and invalidation after mutations. Hand-rolling that in Redux is the classic over-engineering trap. Redux/Zustand remain fine for genuinely client-owned state (wizard progress, selections, undo stacks).',
        },
        {
          id: 'react-a-4',
          type: 'mcq',
          prompt: 'What is a custom hook, technically?',
          choices: [
            'A special React API you register',
            'A plain function whose name starts with `use` and which calls other hooks',
            'A higher-order component',
            'A class with a render method',
          ],
          answer: 1,
          explain: 'No magic - the `use` prefix is a convention the linter relies on. Each component calling the hook gets its own independent state; hooks share *logic*, never state (that is what context or a store is for).',
        },
        {
          id: 'react-a-5',
          type: 'mcq',
          prompt: 'Which is still not possible with a function component alone?',
          choices: [
            'Catching render errors from children (an error boundary needs a class or a library wrapper)',
            'Accessing the DOM',
            'Running code on unmount',
            'Sharing state between components',
          ],
          answer: 0,
          explain: '`componentDidCatch` / `getDerivedStateFromError` have no hook equivalent, so error boundaries are the one remaining class component in most codebases - usually via `react-error-boundary`. Also note boundaries do not catch errors in event handlers or async code.',
        },
        {
          id: 'react-a-6',
          type: 'flash',
          prompt: 'Sketch how you would structure a small CRUD app: list users, view one, create and edit.',
          answer: 'Routes with React Router: /users (list), /users/:id (detail), /users/new and /users/:id/edit. A thin api module wrapping fetch that throws on non-2xx and returns parsed JSON. TanStack Query for reads (useQuery keyed by ["users"] and ["users", id]) and writes (useMutation that invalidates those keys on success), which gives loading and error states, caching and refetch for free. Forms with React Hook Form plus a Zod schema shared with the API types. A shared layout with an error boundary and a suspense fallback. Local UI state (filters, modals) stays in useState in the nearest component; auth in a context provider. Feature-folder structure - users/ containing its components, hooks and api calls - rather than splitting by file type.',
          explain: 'This is the standard "design a small app" question. Mentioning cache invalidation after mutations, and separating server state from UI state, is what marks a mid-level answer.',
        },
      ],
    },
  ],
};
