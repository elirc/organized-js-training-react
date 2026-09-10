export default {
  id: 'tooling',
  name: 'Git, Build & Testing',
  mark: 'TL',
  color: '#94a3b8',
  blurb: 'The daily-workflow questions: branching and merge conflicts, what a bundler does, and how much of what to test.',
  modules: [
    /* ------------------------------------------------------------------ */
    {
      id: 'tool-git',
      name: 'Git in a team',
      tier: 2,
      minutes: 14,
      lesson: {
        summary:
          'Nobody expects git internals. They expect you to branch, review, resolve a conflict and undo a mistake without panicking.',
        bullets: [
          'Three areas: **working directory** -> `git add` -> **staging area (index)** -> `git commit` -> **local repository** -> `git push` -> remote.',
          'Everyday loop: branch from main, commit small changes, push, open a pull request, get review, merge, delete the branch.',
          '`git fetch` downloads; `git pull` = fetch + merge (or rebase with `--rebase`).',
          '**Merge** preserves history and adds a merge commit. **Rebase** replays your commits on top of the target for a linear history. Never rebase a branch other people have pulled.',
          'A **conflict** happens when two branches change the same lines. Git marks them with `<<<<<<<`, you edit the file, then `git add` and continue.',
          'Undo: `git restore <file>` (discard local change), `git reset --soft HEAD~1` (uncommit, keep changes), `git revert <sha>` (new commit undoing an old one - the safe choice on shared branches).',
          '`git reset --hard` and force-pushing shared branches destroy other people\'s work. `--force-with-lease` is the safer force.',
          '`.gitignore` keeps `node_modules`, `bin/obj`, `.env` and build output out of the repository.',
        ],
        code: {
          lang: 'bash',
          src: `git switch -c feature/user-search
git add -p                       # stage hunks interactively
git commit -m "Add user search endpoint"
git push -u origin feature/user-search

git switch main && git pull
git switch feature/user-search
git rebase main                  # replay my work on the latest main
# fix conflicts, then:
git add . && git rebase --continue

git log --oneline --graph -20
git revert 8a3f21c               # safe undo on a shared branch
git stash && git stash pop       # park work in progress`,
        },
        gotchas: [
          'Committing `.env` or a connection string means rotating the secret - deleting it later does not remove it from history.',
          '`git pull` with local commits creates noisy merge commits; `git pull --rebase` keeps history clean.',
          '`git reset --hard` discards uncommitted work permanently.',
        ],
        interview: [
          'Merge vs rebase - when do you use each?',
          'How do you resolve a merge conflict?',
          'You committed a secret. What now?',
        ],
      },
      questions: [
        {
          id: 'tool-g-1',
          type: 'mcq',
          prompt: 'Difference between `git fetch` and `git pull`?',
          choices: [
            'They are identical',
            '`fetch` downloads remote changes without touching your working tree; `pull` fetches **and** merges (or rebases) into your branch',
            '`fetch` only works on tags',
            '`pull` is read-only',
          ],
          answer: 1,
          explain: '`fetch` is always safe - inspect with `git log main..origin/main` before integrating. `pull` can produce a conflict or an unexpected merge commit right when you were not ready for one.',
        },
        {
          id: 'tool-g-2',
          type: 'mcq',
          prompt: 'You pushed a broken commit to `main`, which teammates have already pulled. Safest fix?',
          choices: [
            '`git reset --hard` and force push',
            '`git revert <sha>` to add a new commit that undoes it',
            'Delete and recreate the branch',
            'Amend the commit and force push',
          ],
          answer: 1,
          explain: 'Revert never rewrites shared history, so nobody\'s clone breaks and the audit trail of what happened stays intact. Rewriting published history is only acceptable on a branch you alone own.',
        },
        {
          id: 'tool-g-3',
          type: 'mcq',
          prompt: 'When should you **not** rebase?',
          choices: [
            'Never, rebase is always better',
            'When the branch has already been pushed and others have based work on it - rebasing rewrites commit hashes',
            'On a branch with more than 5 commits',
            'When there are no conflicts',
          ],
          answer: 1,
          explain: 'Rebase creates new commits with new hashes; anyone who pulled the old ones now has a divergent history and a painful merge. The golden rule: rebase your own unshared work, merge everything else.',
        },
        {
          id: 'tool-g-4',
          type: 'mcq',
          prompt: 'You accidentally committed and pushed an API key. What must you do?',
          choices: [
            'Delete the line and commit the fix',
            'Rotate/revoke the key immediately - it is in the history and in every clone - then purge the history if required',
            'Force push over the commit',
            'Make the repository private',
          ],
          answer: 1,
          explain: 'Assume the secret is compromised the instant it is pushed; bots scan public repositories within seconds. Rotation is the only fix that matters. History rewriting (`git filter-repo`, BFG) is cleanup, not remediation.',
        },
        {
          id: 'tool-g-5',
          type: 'short',
          prompt: 'Which command temporarily parks uncommitted changes so you can switch branches?',
          answer: ['git stash', 'stash'],
          explain: '`git stash` saves both staged and unstaged changes and cleans the working tree; `git stash pop` reapplies and drops it. `git stash list` shows the stack - it is easy to forget work in there.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'tool-build',
      name: 'Bundlers, environments and CI',
      tier: 3,
      minutes: 14,
      lesson: {
        summary:
          'What happens between `npm run dev` and a URL your users can visit. Interviewers ask this to check you have shipped something, not just run it locally.',
        bullets: [
          'A **bundler** (Vite/Rollup, webpack, esbuild) resolves the import graph, transpiles, minifies, tree-shakes dead code, hashes filenames for cache busting and emits static assets.',
          'Vite serves native ES modules in dev (instant start, HMR) and bundles with Rollup for production - which is why dev and build behave slightly differently.',
          '**Transpiling** converts newer syntax to older (Babel/SWC/tsc); **polyfilling** adds missing runtime APIs (core-js).',
          'Environment variables are baked in at **build** time for front-end apps (`VITE_*`, `NEXT_PUBLIC_*`) - so they are public. Real secrets stay on the server.',
          'Source maps map minified code back to source for debugging; keep them private or restrict access in production.',
          'A CI pipeline: install (`npm ci`) -> lint -> typecheck -> test -> build -> deploy. Fail fast, in that order.',
          'CD strategies worth naming: blue/green, canary, feature flags, and the ability to roll back.',
          'ESLint catches likely bugs; Prettier formats. Do not argue about formatting - automate it in a pre-commit hook.',
        ],
        code: {
          lang: 'yaml',
          src: `# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck      # tsc --noEmit
      - run: npm test -- --run
      - run: npm run build`,
        },
        gotchas: [
          'Anything prefixed `VITE_`/`NEXT_PUBLIC_` ends up readable in the browser bundle. Never put a secret there.',
          '"Works locally, fails in CI" is usually a case-sensitive import path or a missing environment variable.',
          'Committing `dist/` creates constant merge conflicts - build in CI instead.',
        ],
        interview: [
          'What does a bundler actually do?',
          'How do you manage config between dev, staging and prod?',
          'Describe your CI pipeline.',
        ],
      },
      questions: [
        {
          id: 'tool-b-1',
          type: 'mcq',
          prompt: 'You put an API secret in `VITE_API_SECRET` and use it in a React component. What is the problem?',
          choices: [
            'Nothing, Vite encrypts it',
            'Build-time variables are inlined into the JavaScript bundle, so anyone can read it in DevTools',
            'It only works in development',
            'The name must be uppercase',
          ],
          answer: 1,
          explain: 'The browser has to receive the value to use it - there is no way to hide it. Anything secret must live on a server you control; the front end calls *your* endpoint, which holds the key.',
        },
        {
          id: 'tool-b-2',
          type: 'mcq',
          prompt: 'What is tree-shaking?',
          choices: [
            'Removing unused CSS classes',
            'Eliminating exports that are never imported, using static ESM analysis, so they are dropped from the bundle',
            'Compressing images',
            'Splitting code by route',
          ],
          answer: 1,
          explain: 'It relies on ES module imports being statically analysable - which is one reason ESM beat CommonJS for front-end code. Side-effectful modules block it, which is what `"sideEffects": false` in package.json declares.',
        },
        {
          id: 'tool-b-3',
          type: 'mcq',
          prompt: 'Sensible order for a CI pipeline?',
          choices: [
            'deploy -> test -> lint',
            'install -> lint -> typecheck -> test -> build -> deploy',
            'build -> deploy -> test',
            'test -> deploy -> lint -> build',
          ],
          answer: 1,
          explain: 'Cheapest and fastest feedback first. A lint failure in 10 seconds beats discovering it after a 6-minute test run. Deployment only happens once everything upstream is green.',
        },
        {
          id: 'tool-b-4',
          type: 'mcq',
          prompt: 'Why do bundlers add a content hash to output filenames (`app.4f3a1c.js`)?',
          choices: [
            'To obfuscate the code',
            'Cache busting - the URL changes only when the content changes, so assets can be cached aggressively and forever',
            'To fit CDN naming rules',
            'To prevent tampering',
          ],
          answer: 1,
          explain: 'It lets you serve `Cache-Control: max-age=31536000, immutable` for JS/CSS while the HTML entry point stays uncached. Users get new code the instant you deploy, with no stale-cache support tickets.',
        },
        {
          id: 'tool-b-5',
          type: 'tf',
          prompt: 'Transpiling and polyfilling are the same thing.',
          answer: false,
          explain: 'Transpiling rewrites *syntax* (arrow functions, optional chaining) into an older form. Polyfilling supplies missing *runtime APIs* (`Promise`, `Array.prototype.at`, `fetch`) with a JavaScript implementation. You often need both, driven by a browserslist target.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'tool-test',
      name: 'Testing, in proportion',
      tier: 3,
      minutes: 14,
      lesson: {
        summary:
          'Interviewers rarely ask you to recite framework APIs. They ask what you test, at which level, and why.',
        bullets: [
          'The pyramid: many fast **unit** tests, fewer **integration** tests, a small number of **end-to-end** tests. E2E is the slowest and flakiest, so spend it on critical journeys.',
          'Test **behaviour, not implementation**. A test that breaks when you rename a private method is a liability.',
          'Arrange-Act-Assert keeps tests readable. One reason to fail per test.',
          'JS tooling: **Vitest**/Jest as the runner, **React Testing Library** for components (query by role and label, like a user), **Playwright**/Cypress for E2E, **MSW** to fake the network.',
          '.NET tooling: **xUnit**, **Moq**/NSubstitute, **FluentAssertions**, `WebApplicationFactory` for in-memory integration tests, Testcontainers for a real database.',
          'Mock at the boundary - the network, the clock, the file system. Mocking your own internals just tests your mocks.',
          'Coverage is a smoke detector, not a goal. 100% coverage of trivial getters proves nothing.',
          'A bug fix should come with the failing test that would have caught it.',
        ],
        code: {
          lang: 'jsx',
          src: `test('shows an error when login fails', async () => {
  server.use(http.post('/api/login', () => HttpResponse.json({}, { status: 401 })));
  render(<LoginForm />);

  await userEvent.type(screen.getByLabelText(/email/i), 'ada@x.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent(/invalid/i);
});`,
        },
        gotchas: [
          'Querying by CSS class or test id everywhere means your tests do not resemble how users find things.',
          'Snapshot tests that everyone updates without reading are worse than no tests.',
          'A test suite that needs a specific run order is already broken.',
        ],
        interview: [
          'What do you unit test vs integration test?',
          'How do you test a component that fetches data?',
          'What makes a test valuable?',
        ],
      },
      questions: [
        {
          id: 'tool-t-1',
          type: 'mcq',
          prompt: 'Why does the testing pyramid put E2E tests at the top (fewest)?',
          choices: [
            'They are the least useful',
            'They are slow, expensive to maintain and prone to flakiness, so you keep them for the highest-value journeys',
            'They cannot test the UI',
            'They only run in production',
          ],
          answer: 1,
          explain: 'E2E gives the most confidence per test but the worst feedback loop. The usual answer: unit tests for logic and edge cases, integration for wiring, and a handful of E2E covering signup, checkout, login.',
        },
        {
          id: 'tool-t-2',
          type: 'mcq',
          prompt: 'React Testing Library encourages `getByRole` and `getByLabelText` over `getByTestId`. Why?',
          choices: [
            'They are faster',
            'They find elements the way a user (and a screen reader) would, so the test breaks only when the user-visible behaviour breaks',
            'Test ids are deprecated',
            'They allow snapshot testing',
          ],
          answer: 1,
          explain: 'It couples tests to behaviour rather than markup, and it surfaces accessibility problems for free - if no accessible role or label exists, real assistive technology cannot find it either. `getByTestId` remains a fine escape hatch.',
        },
        {
          id: 'tool-t-3',
          type: 'mcq',
          prompt: 'You test a component that calls `/api/users`. What should you mock?',
          choices: [
            'The component\'s internal state setters',
            'The network layer - e.g. MSW intercepting the HTTP request - so the component runs its real fetching code',
            'React itself',
            'Nothing, hit the real API',
          ],
          answer: 1,
          explain: 'Mock at the boundary you do not own. Intercepting HTTP means your real query hooks, error handling and loading states are exercised, and the same handlers work in unit tests, Storybook and E2E.',
        },
        {
          id: 'tool-t-4',
          type: 'tf',
          prompt: '100% code coverage means the code is well tested.',
          answer: false,
          explain: 'Coverage measures which lines executed, not whether you asserted anything meaningful or covered the interesting inputs. A test that calls a function and asserts nothing still shows green. Low coverage is a real warning sign; high coverage is not a guarantee.',
        },
        {
          id: 'tool-t-5',
          type: 'flash',
          prompt: 'A bug reaches production. Walk through what you do.',
          answer: 'Reduce impact first - roll back, disable the feature flag, or ship a hotfix, depending on severity and blast radius. Reproduce it reliably, ideally in a test rather than by clicking. Write the failing test that captures the bug at the lowest level that reproduces it, then fix the code until it passes, so the regression is locked out permanently. Review whether the same class of mistake exists elsewhere. Then look at why it escaped: was it a missing test, a gap in review, an untested edge case, a monitoring blind spot? Fix that too, and write a short blameless postmortem for anything user-visible.',
          explain: 'What is being assessed is process and ownership: mitigate, reproduce, regression test, fix, then improve the system that let it through.',
        },
      ],
    },
  ],
};
