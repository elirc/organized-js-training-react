export default {
  id: 'typescript',
  name: 'TypeScript',
  mark: 'TS',
  color: '#3178c6',
  blurb: 'Types that vanish at runtime. Structural typing, narrowing, generics, and the tsconfig flags teams actually argue about.',
  modules: [
    /* ------------------------------------------------------------------ */
    {
      id: 'ts-basics',
      name: 'What TypeScript actually is',
      tier: 2,
      minutes: 12,
      lesson: {
        summary:
          'TypeScript is a compile-time type checker that erases to plain JavaScript. It cannot protect you at runtime - the single most important idea to internalise, and the thing juniors most often get wrong in interviews.',
        bullets: [
          'Types are **erased**. The emitted JS has no type information at all - there is no runtime type check unless you write one.',
          'The type system is **structural**, not nominal: if the shape matches, it fits. Two unrelated interfaces with the same members are interchangeable (unlike C#).',
          '`any` switches the checker off for that value and everything it touches. `unknown` is the safe counterpart - you must narrow before using it.',
          'Prefer **inference**. Annotate function parameters, return types on public APIs, and object shapes; let the rest be inferred.',
          '`strict: true` is the whole point. Without `strictNullChecks`, `null` and `undefined` are assignable to everything and the checker barely helps.',
          'Type assertions (`value as Foo`) are a promise to the compiler, not a conversion. If you lie, you get a runtime crash.',
        ],
        code: {
          lang: 'ts',
          src: `// structural typing: no "implements" needed
interface Point { x: number; y: number }
const p = { x: 1, y: 2, label: 'origin' };
const q: Point = p;              // OK - has the required shape

// but object literals are checked for excess properties
const r: Point = { x: 1, y: 2, label: 'origin' }; // Error

// any vs unknown
let a: any = JSON.parse(text);
a.whatever.deeply.nested;        // compiles, may explode

let u: unknown = JSON.parse(text);
u.trim();                        // Error - must narrow first
if (typeof u === 'string') u.trim();  // OK

// assertion is a promise, not a check
const user = JSON.parse(text) as User;   // no validation happens here`,
        },
        gotchas: [
          '`as` never validates. Parsing API JSON `as User` is a lie the compiler happily believes.',
          'Excess property checks only fire on fresh object literals - assign via a variable and they disappear.',
          'Types are gone at runtime, so `if (x instanceof MyInterface)` is not a thing.',
        ],
        interview: [
          '`any` vs `unknown` - when would you use each?',
          'Does TypeScript give you runtime safety?',
          'What is structural typing?',
        ],
      },
      questions: [
        {
          id: 'ts-b-1',
          type: 'mcq',
          prompt: 'Your API returns a malformed payload and the app crashes, even though the response was typed as `User`. Why did TypeScript not catch it?',
          choices: [
            'You needed `strict: true`',
            'Types are erased at compile time; `as User` asserts a shape but validates nothing at runtime',
            'The interface was missing `implements`',
            'You should have used a `class` instead',
          ],
          answer: 1,
          explain: 'This is the number one TypeScript interview question in disguise. The fix is runtime validation at the boundary - Zod, Valibot, io-ts or a hand-written type guard - so the type and the data cannot diverge.',
        },
        {
          id: 'ts-b-2',
          type: 'mcq',
          prompt: 'Which is the meaningful difference between `any` and `unknown`?',
          choices: [
            'None, `unknown` is just the newer name',
            '`unknown` accepts any value but forbids using it until you narrow; `any` disables checking entirely',
            '`any` is faster to compile',
            '`unknown` cannot be assigned from a function return',
          ],
          answer: 1,
          explain: 'Both accept anything on the way in. The difference is on the way out: `unknown` blocks property access, calls and assignment to other types until you prove the shape. Reach for `unknown` at every boundary (JSON, `catch`, third-party data).',
        },
        {
          id: 'ts-b-3',
          type: 'mcq',
          prompt: 'In C# a class must declare `: IShape` to satisfy an interface. In TypeScript?',
          choices: [
            'The same - you must write `implements`',
            'Any value with a compatible shape satisfies the interface; `implements` is optional and only checks the class',
            'Interfaces cannot describe classes',
            'You must use a type alias instead',
          ],
          answer: 1,
          explain: 'Structural ("duck") typing. `implements` is available and useful as a sanity check while writing the class, but it does not create a nominal relationship - anything shaped right is assignable.',
        },
        {
          id: 'ts-b-4',
          type: 'tf',
          prompt: 'Enabling `strict: true` mainly affects `strictNullChecks`, `noImplicitAny` and `strictFunctionTypes`.',
          answer: true,
          explain: '`strict` is an umbrella that turns on that family of flags. `strictNullChecks` is the big one: without it, `null` and `undefined` inhabit every type and the checker cannot warn you about the most common runtime error there is.',
        },
        {
          id: 'ts-b-5',
          type: 'short',
          prompt: 'Which library is the usual answer for validating API responses at runtime so the parsed value is actually typed?',
          answer: ['zod', 'zod schema'],
          explain: 'Zod (or Valibot, Yup, io-ts, ArkType) lets you declare a schema once, derive the static type with `z.infer<typeof Schema>`, and call `Schema.parse(json)` to check at runtime. One source of truth instead of a type and a validator that drift apart.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'ts-shapes',
      name: 'Interfaces, unions and narrowing',
      tier: 3,
      minutes: 16,
      lesson: {
        summary:
          'Modelling data well is where TypeScript pays for itself. Discriminated unions turn "this field is sometimes present" into states the compiler can check exhaustively.',
        bullets: [
          '`interface` and `type` are nearly interchangeable for object shapes. `interface` supports declaration merging and reads better in errors; `type` also handles unions, intersections, tuples and mapped types.',
          'Team convention beats theory: many teams use `interface` for public object contracts and `type` for everything else.',
          'A **discriminated union** is a union of object types sharing a literal tag field - `{ status: "loading" } | { status: "error", error: Error }`.',
          'The compiler **narrows** types through `typeof`, `instanceof`, `in`, truthiness, equality and custom type guards (`x is Foo`).',
          'Add a `default: const _exhaustive: never = value;` case so adding a new variant becomes a compile error rather than a silent bug.',
          'Literal union types (`type Role = "admin" | "user"`) usually beat `enum` - they erase to nothing and work naturally with JSON.',
        ],
        code: {
          lang: 'ts',
          src: `type Result =
  | { status: 'loading' }
  | { status: 'success'; data: User[] }
  | { status: 'error'; error: string };

function render(r: Result) {
  switch (r.status) {
    case 'loading': return spinner();
    case 'success': return list(r.data);      // r.data known to exist
    case 'error':   return alert(r.error);
    default: {
      const _never: never = r;                // compile error if a case is added
      return null;
    }
  }
}

// custom type guard
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'id' in value;
}

// optional vs undefined - not the same thing
interface A { name?: string }              // may be absent
interface B { name: string | undefined }   // must be present, may be undefined`,
        },
        gotchas: [
          '`isLoading` + `data` + `error` as three independent fields lets you represent impossible states. A union does not.',
          '`enum` emits real runtime objects (except `const enum`) - a surprise if you expected pure erasure.',
          'Narrowing is lost after an `await` or a callback boundary, because the compiler cannot prove nothing changed.',
        ],
        interview: [
          '`interface` vs `type`?',
          'What is a discriminated union and why is it better than optional flags?',
          'How do you write a type guard?',
        ],
      },
      questions: [
        {
          id: 'ts-s-1',
          type: 'mcq',
          prompt: 'Which is true of `interface` but **not** of `type`?',
          choices: [
            'It can describe a union',
            'Two declarations with the same name merge into one',
            'It can be generic',
            'It can describe a function signature',
          ],
          answer: 1,
          explain: 'Declaration merging is interface-only, and it is how you augment third-party types (e.g. adding `user` to Express\'s `Request`). Unions, intersections, tuples and mapped/conditional types are `type`-only. Both support generics and function signatures.',
        },
        {
          id: 'ts-s-2',
          type: 'mcq',
          prompt: 'Your loading state is modelled as `{ isLoading: boolean; data?: User[]; error?: string }`. What is the problem?',
          choices: [
            'It uses too much memory',
            'It permits impossible states (loading **and** error, or neither) and forces optional-chaining everywhere',
            'Optional properties are not allowed in interfaces',
            'Nothing, this is the recommended shape',
          ],
          answer: 1,
          explain: '"Make illegal states unrepresentable." A discriminated union on `status` means the compiler knows `data` exists exactly in the success branch, removing a whole class of `undefined` bugs and every defensive `?.`.',
        },
        {
          id: 'ts-s-3',
          type: 'mcq',
          prompt: 'What does the return type `value is User` do in `function isUser(value: unknown): value is User`?',
          choices: [
            'Nothing, it is documentation',
            'Declares a type predicate, so a `true` result narrows the argument to `User` in the caller',
            'Forces a runtime cast',
            'Makes the function generic',
          ],
          answer: 1,
          explain: 'A user-defined type guard. The compiler trusts your boolean, so the check inside must genuinely verify the shape - otherwise you have just written a fancy `as`.',
        },
        {
          id: 'ts-s-4',
          type: 'mcq',
          prompt: 'Why do many teams prefer `type Role = "admin" | "user"` over `enum Role { Admin, User }`?',
          choices: [
            'Enums are deprecated',
            'The union erases completely, matches JSON values directly, and needs no import at the call site',
            'Enums cannot be used in switch statements',
            'Unions are faster at runtime',
          ],
          answer: 1,
          explain: 'A numeric enum also happily accepts any number in older TS versions and produces a reverse-mapping object at runtime. String literal unions are pure types with zero output, and API payloads already speak strings.',
        },
        {
          id: 'ts-s-5',
          type: 'mcq',
          prompt: 'What is the point of `const _exhaustive: never = value;` in a switch default?',
          choices: [
            'It logs unhandled cases at runtime',
            'It makes adding a new union member a compile-time error until every switch handles it',
            'It improves performance',
            'It is required by ESLint',
          ],
          answer: 1,
          explain: 'If every case is handled, `value` narrows to `never` and the assignment is fine. Add a variant and `value` is no longer `never`, so the build fails at exactly the places you must update. Cheap, mechanical safety.',
        },
        {
          id: 'ts-s-6',
          type: 'tf',
          prompt: '`name?: string` and `name: string | undefined` mean the same thing.',
          answer: false,
          explain: 'The optional version allows the key to be missing entirely; the union version requires the key to be present, even if its value is `undefined`. It matters for `in` checks, `Object.keys`, and for `exactOptionalPropertyTypes`.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'ts-generics',
      name: 'Generics and utility types',
      tier: 3,
      minutes: 16,
      lesson: {
        summary:
          'Generics let a function keep the relationship between its input and output types. Utility types save you from re-declaring shapes you already have.',
        bullets: [
          '`function first<T>(items: T[]): T | undefined` preserves the element type instead of collapsing to `any`.',
          'Constrain with `extends`: `<T extends { id: string }>` means "any type that at least has an id".',
          '`keyof T` is the union of T\'s keys; `T[K]` indexes a type. Together they type property getters safely.',
          'Everyday utility types: `Partial<T>`, `Required<T>`, `Readonly<T>`, `Pick<T, K>`, `Omit<T, K>`, `Record<K, V>`, `ReturnType<F>`, `Awaited<T>`, `NonNullable<T>`.',
          'Derive types from values with `typeof` and `as const` instead of maintaining two lists.',
        ],
        code: {
          lang: 'ts',
          src: `function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const name = getProp(user, 'name');   // typed as string, not any

// utility types in a real CRUD API
type User        = { id: string; name: string; email: string; createdAt: Date };
type CreateUser  = Omit<User, 'id' | 'createdAt'>;
type UpdateUser  = Partial<CreateUser>;
type UserSummary = Pick<User, 'id' | 'name'>;
type UsersById   = Record<string, User>;

// derive a type from a value
const ROLES = ['admin', 'editor', 'viewer'] as const;
type Role = typeof ROLES[number];     // 'admin' | 'editor' | 'viewer'

// unwrap a promise
type Data = Awaited<ReturnType<typeof fetchUsers>>;`,
        },
        gotchas: [
          'Without `as const`, `["admin", "viewer"]` is inferred as `string[]` and you lose the literals.',
          '`Omit` does not check that the key exists; `Pick` does. Typos in `Omit` silently do nothing.',
          'Generic parameters that appear only once in a signature are usually a sign you wanted a plain union.',
        ],
        interview: [
          'Write a typed `getProp(obj, key)`.',
          'Which utility types do you use most, and for what?',
          'How would you type a create-vs-update DTO from one model?',
        ],
      },
      questions: [
        {
          id: 'ts-g-1',
          type: 'mcq',
          prompt: 'Which signature correctly types "get the value at `key` from `obj`"?',
          choices: [
            '`function get<T>(obj: T, key: string): any`',
            '`function get<T, K extends keyof T>(obj: T, key: K): T[K]`',
            '`function get(obj: object, key: string): unknown`',
            '`function get<T>(obj: T, key: keyof any): T`',
          ],
          answer: 1,
          explain: '`K extends keyof T` restricts the key to real properties (a typo is a compile error) and `T[K]` returns that property\'s exact type. This is the canonical generics whiteboard question.',
        },
        {
          id: 'ts-g-2',
          type: 'mcq',
          prompt: 'You have `type User = { id: string; name: string; createdAt: Date }`. How do you express the body of a POST that omits server-generated fields?',
          choices: [
            '`Partial<User>`',
            '`Omit<User, "id" | "createdAt">`',
            '`Readonly<User>`',
            '`Record<string, User>`',
          ],
          answer: 1,
          explain: '`Omit` removes keys; `Partial` would make *everything* optional, which wrongly allows a POST with no name. A PATCH body, on the other hand, is a good use for `Partial<Omit<User, "id">>`.',
        },
        {
          id: 'ts-g-3',
          type: 'mcq',
          prompt: 'What is `typeof ROLES[number]` when `const ROLES = ["admin", "user"] as const`?',
          choices: ['`string`', '`"admin" | "user"`', '`readonly string[]`', '`number`'],
          answer: 1,
          explain: 'Indexing an array type with `number` gives the element type; `as const` keeps the literals instead of widening to `string`. One array drives both the runtime list and the type - no duplication to drift.',
        },
        {
          id: 'ts-g-4',
          type: 'short',
          prompt: 'Which utility type unwraps `Promise<User[]>` to `User[]`?',
          answer: ['Awaited', 'Awaited<T>', 'Awaited<Promise<User[]>>'],
          explain: '`Awaited<T>` recursively unwraps promises, so it also handles `Promise<Promise<T>>`. Combined with `ReturnType<typeof fn>` it types "whatever this async function resolves to" without repeating the shape.',
        },
        {
          id: 'ts-g-5',
          type: 'mcq',
          prompt: 'What does `Record<string, User>` describe?',
          choices: [
            'An array of users',
            'An object whose keys are strings and whose values are `User`',
            'A user with all fields readonly',
            'A tuple of a string and a user',
          ],
          answer: 1,
          explain: 'A dictionary/lookup type - exactly what you get from `Object.fromEntries(users.map(u => [u.id, u]))`. Note that indexing it is typed as `User`, not `User | undefined`, unless you enable `noUncheckedIndexedAccess`.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'ts-practice',
      name: 'TypeScript in a real codebase',
      tier: 4,
      minutes: 14,
      lesson: {
        summary:
          'The questions a mid-level candidate gets: how does the build work, where do types come from, and how do you keep front end and back end in sync.',
        bullets: [
          '`tsc` type-checks and emits. Most apps let a bundler (Vite/esbuild/SWC) strip types for speed and run `tsc --noEmit` separately in CI - fast builds, still fully checked.',
          'Third-party types come from the package itself or from `@types/x` (DefinitelyTyped).',
          '`d.ts` files are types with no implementation - what a published library ships.',
          'Keeping client and server in sync: share a types package, generate from OpenAPI/Swagger, generate from the DB (Prisma, Drizzle, EF scaffolding), or use an end-to-end typed RPC layer like tRPC.',
          '`satisfies` checks a value against a type without widening it - the modern way to type config objects.',
          'Enable `noUncheckedIndexedAccess` and you will catch a surprising number of `undefined` array bugs.',
        ],
        code: {
          lang: 'ts',
          src: `// package.json
// "scripts": { "typecheck": "tsc --noEmit", "build": "vite build" }

// satisfies keeps the literal types AND checks the shape
const config = {
  port: 3000,
  env: 'production',
} satisfies { port: number; env: 'development' | 'production' };
config.env;   // typed as 'production', not string

// declaration merging to extend Express
declare global {
  namespace Express {
    interface Request { user?: { id: string; role: Role } }
  }
}`,
        },
        gotchas: [
          'A green `vite build` does not mean the types pass - bundlers only strip types. Run `tsc --noEmit` in CI.',
          '`@ts-ignore` hides the next line entirely; `@ts-expect-error` fails the build once the error is fixed. Prefer the latter.',
          '`skipLibCheck: true` is normal and recommended - it skips checking `.d.ts` files, not your code.',
        ],
        interview: [
          'How does TypeScript fit into your build pipeline?',
          'How do you keep API types in sync between front end and back end?',
          '`as` vs `satisfies`?',
        ],
      },
      questions: [
        {
          id: 'ts-p-1',
          type: 'mcq',
          prompt: 'CI runs `vite build` and passes, but a type error reaches main. What is missing?',
          choices: [
            'A separate `tsc --noEmit` type-check step',
            '`strict: true`',
            'A newer TypeScript version',
            '`skipLibCheck: false`',
          ],
          answer: 0,
          explain: 'esbuild/SWC strip types without checking them - that is why they are so fast. Every real pipeline runs `tsc --noEmit` (or `vue-tsc`/`astro check`) as its own job.',
        },
        {
          id: 'ts-p-2',
          type: 'mcq',
          prompt: 'Where do types for an untyped npm package usually come from?',
          choices: [
            'TypeScript infers them from the source',
            'A community-maintained `@types/<package>` package from DefinitelyTyped',
            'You must fork the package',
            'They are downloaded at runtime',
          ],
          answer: 1,
          explain: 'Modern packages ship their own `.d.ts` (look for a `types` field in package.json). Otherwise install `@types/express`, `@types/node`, etc. If neither exists, write a minimal `declare module "x"` stub.',
        },
        {
          id: 'ts-p-3',
          type: 'mcq',
          prompt: 'What does `satisfies` do that `as` does not?',
          choices: [
            'It validates at runtime',
            'It checks the value against the type while keeping the narrower inferred literal types',
            'It is a shorter alias for `as`',
            'It makes the value readonly',
          ],
          answer: 1,
          explain: 'Annotating with `: Type` widens (`env` becomes the whole union). `as Type` asserts and can lie. `satisfies` checks *and* preserves - ideal for route tables, theme objects and config maps.',
        },
        {
          id: 'ts-p-4',
          type: 'multi',
          prompt: 'Which are legitimate ways to stop front-end and back-end types drifting apart?',
          choices: [
            'Generate a client from the OpenAPI/Swagger spec',
            'Share a types-only workspace package in a monorepo',
            'Copy the interfaces by hand and add a comment',
            'Use a typed RPC layer such as tRPC (same-language stacks)',
            'Generate types from the database schema (Prisma, Drizzle, EF scaffolding)',
          ],
          answer: [0, 1, 3, 4],
          explain: 'For a .NET back end, Swashbuckle/NSwag emitting a TypeScript client from the OpenAPI document is the standard answer, and it is exactly what an interviewer wants to hear. Hand-copying is what everyone does first and regrets by the second sprint.',
        },
        {
          id: 'ts-p-5',
          type: 'tf',
          prompt: 'Prefer `@ts-expect-error` over `@ts-ignore` when you must suppress an error.',
          answer: true,
          explain: '`@ts-expect-error` itself becomes an error once the underlying problem is fixed, so the suppression cannot outlive its reason. `@ts-ignore` silently rots forever.',
        },
      ],
    },
  ],
};
