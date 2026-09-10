export default {
  id: 'foundations',
  name: 'Foundations',
  mark: '01',
  color: '#34d399',
  blurb: 'Start here if the words "stack", "API" or "terminal" are still fuzzy. The vocabulary and mental models everything else assumes.',
  modules: [
    /* ------------------------------------------------------------------ */
    {
      id: 'found-stack',
      name: 'What a web app actually is',
      tier: 1,
      minutes: 12,
      lesson: {
        summary:
          'A CRUD web app is three things talking to each other: a browser running your front end, a server running your back end, and a database that remembers. "The stack" is just the list of technologies you picked for each part.',
        bullets: [
          '**Front end** runs in the user\'s browser: HTML (structure), CSS (appearance), JavaScript (behaviour). React is a JavaScript library for building this part.',
          '**Back end** runs on a server you control: it enforces rules, checks permissions and talks to the database. Node/Express or ASP.NET Core are two ways to write it.',
          '**Database** stores data permanently. SQL databases (PostgreSQL, SQL Server, MySQL) store rows in tables.',
          'The two halves talk over an **API** - usually HTTP requests carrying **JSON**.',
          '**CRUD** = Create, Read, Update, Delete. Nearly every business app is these four operations over some list of things.',
          'Never trust the front end. Anyone can edit the page or send their own requests, so every rule that matters is enforced on the server.',
          '"Full stack" means you can work on both halves. That is the job this app is aiming you at.',
        ],
        code: {
          lang: 'text',
          src: `  Browser                    Server                    Database
┌───────────────┐        ┌─────────────────┐        ┌────────────┐
│ React app     │  HTTP  │ Express / .NET  │  SQL   │ Postgres   │
│ HTML CSS JS   │ ─────► │ routes, rules,  │ ─────► │ tables     │
│               │ ◄───── │ auth, validation│ ◄───── │ rows       │
└───────────────┘  JSON  └─────────────────┘  rows  └────────────┘
   what the user           what you can              what is
   can see and tamper      actually trust            remembered

GET  /api/tasks       -> read   ("give me the list")
POST /api/tasks       -> create ("add this one")
PUT  /api/tasks/7     -> update ("replace number 7")
DELETE /api/tasks/7   -> delete ("remove number 7")`,
        },
        gotchas: [
          '"It works on my machine" usually means something is configured differently, not that the code is fine.',
          'A "500" is your server\'s fault; a "400" is the caller\'s fault. Read the number before you guess.',
          'The browser can only do what the user permits - it is not a safe place for secrets or rules.',
        ],
        interview: [
          'What is the difference between front end and back end?',
          'What does CRUD stand for?',
          'Why can you not trust data coming from the browser?',
        ],
      },
      questions: [
        {
          id: 'fd-st-1',
          type: 'mcq',
          prompt: 'What does **CRUD** stand for?',
          choices: [
            'Compile, Run, Update, Deploy',
            'Create, Read, Update, Delete',
            'Cache, Route, Upload, Download',
            'Client, Router, User, Database',
          ],
          answer: 1,
          explain: 'The four operations almost every business application performs on its data. A "CRUD app" - a to-do list, an invoicing tool, an admin panel - is the bread and butter of junior and mid-level web jobs.',
        },
        {
          id: 'fd-st-2',
          type: 'mcq',
          prompt: 'Where must a rule like "only admins may delete a user" be enforced?',
          choices: [
            'In the React component, by hiding the button',
            'On the server, in the endpoint that performs the delete',
            'In the CSS',
            'In the database only',
          ],
          answer: 1,
          explain: 'Anyone can open DevTools, un-hide the button, or send the request with curl. Hiding UI is a courtesy to honest users; the server is the only place a rule cannot be bypassed. (Enforcing it in the database too is good defence in depth.)',
        },
        {
          id: 'fd-st-3',
          type: 'mcq',
          prompt: 'What is an **API** in this context?',
          choices: [
            'A programming language',
            'A defined set of URLs and rules the front end uses to ask the back end for data or actions',
            'The database itself',
            'A type of server',
          ],
          answer: 1,
          explain: 'Literally "application programming interface" - a contract between two pieces of software. For web apps it usually means HTTP endpoints exchanging JSON, e.g. `GET /api/tasks` returning a list of tasks.',
        },
        {
          id: 'fd-st-4',
          type: 'mcq',
          prompt: 'Which trio describes the three languages the browser itself runs?',
          choices: [
            'HTML, CSS, JavaScript',
            'C#, SQL, JSON',
            'React, Node, Express',
            'HTTP, TCP, DNS',
          ],
          answer: 0,
          explain: 'HTML is the structure, CSS the presentation, JavaScript the behaviour. React, Vue and Angular are all *JavaScript* libraries - the browser still only runs those three. TypeScript is compiled to JavaScript before it ever reaches a browser.',
        },
        {
          id: 'fd-st-5',
          type: 'tf',
          prompt: 'JSON is a JavaScript-only format that other languages cannot read.',
          answer: false,
          explain: 'JSON borrowed JavaScript\'s object syntax, but it is a plain-text format every language can parse - `System.Text.Json` in C#, `json` in Python, `encoding/json` in Go. That is exactly why a React front end can talk to a .NET back end without either side caring what the other is written in.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'found-code',
      name: 'Variables, functions and control flow',
      tier: 1,
      minutes: 14,
      lesson: {
        summary:
          'The four building blocks every language gives you: store a value, make a decision, repeat something, and package logic into a reusable name. Once you have these, learning a second language is mostly learning new spelling.',
        bullets: [
          'A **variable** is a name for a value. In JavaScript: `let` if it will change, `const` if it will not. Default to `const`.',
          'A **function** takes inputs (parameters), does something, and usually `return`s a result. Naming it well is half of good code.',
          '**Conditionals** (`if`/`else`) choose a branch. **Loops** (`for...of`, `while`) repeat.',
          'For arrays, prefer the named operations over manual loops: `map` (transform each), `filter` (keep some), `find` (get one), `reduce` (combine into one).',
          'Return early to avoid deep nesting - handle the odd cases first, then the main path.',
          'Code is read far more often than it is written. Clear names beat clever one-liners in every code review you will ever have.',
        ],
        code: {
          lang: 'js',
          src: `const taxRate = 0.2;            // will not change
let itemCount = 0;             // will change

function totalWithTax(prices) {
  if (prices.length === 0) return 0;          // handle the edge case first
  const subtotal = prices.reduce((sum, p) => sum + p, 0);
  return subtotal * (1 + taxRate);
}

const names = ['ada', 'grace', 'linus'];

for (const name of names) console.log(name);          // do something with each
const shouted  = names.map(n => n.toUpperCase());     // transform each
const shortOne = names.filter(n => n.length < 5);     // keep some
const found    = names.find(n => n.startsWith('g'));  // get the first match`,
        },
        gotchas: [
          '`=` assigns, `==` loosely compares, `===` strictly compares. Use `===`.',
          'Array indexes start at 0, so the last item is `arr[arr.length - 1]`.',
          '`return` stops the function immediately - anything after it never runs.',
        ],
        interview: [
          'What is the difference between `let` and `const`?',
          'What does a function `return`?',
          'When would you use `map` instead of a `for` loop?',
        ],
      },
      questions: [
        {
          id: 'fd-cd-1',
          type: 'mcq',
          prompt: 'What is the difference between `=`, `==` and `===`?',
          choices: [
            'They are three ways of writing the same thing',
            '`=` assigns a value; `==` compares after converting types; `===` compares value and type with no conversion',
            '`=` compares, `==` assigns, `===` is invalid',
            '`===` is only for numbers',
          ],
          answer: 1,
          explain: 'Accidentally writing `if (x = 5)` assigns 5 and is always truthy - a classic beginner bug. Use `===` for comparison so `"5" === 5` is false rather than surprisingly true.',
        },
        {
          id: 'fd-cd-2',
          type: 'mcq',
          prompt: 'What does this log?',
          code: `const names = ['ada', 'grace'];
const shouted = names.map(n => n.toUpperCase());
console.log(names[0], shouted[0]);`,
          lang: 'js',
          choices: ['"ADA ADA"', '"ada ADA"', '"ada ada"', 'It throws'],
          answer: 1,
          explain: '`map` builds a **new** array and leaves the original untouched. That is why it is safe to use on data you did not create - a habit that becomes essential once you reach React state.',
        },
        {
          id: 'fd-cd-3',
          type: 'mcq',
          prompt: 'You have a list of orders and want only the ones over £100. Which method?',
          choices: ['`map`', '`filter`', '`find`', '`reduce`'],
          answer: 1,
          explain: '`filter` keeps the items whose test returns true and gives you a new array. `map` transforms every item, `find` returns just the first match, `reduce` collapses everything into a single value such as a total.',
        },
        {
          id: 'fd-cd-4',
          type: 'mcq',
          prompt: 'What does `arr[arr.length - 1]` give you?',
          choices: ['The first item', 'The last item', 'The length', 'An error'],
          answer: 1,
          explain: 'Indexes start at 0, so a 3-item array uses indexes 0, 1, 2 - and `arr[3]` is `undefined`, not an error. Modern JavaScript also has `arr.at(-1)`, which reads better.',
        },
        {
          id: 'fd-cd-5',
          type: 'short',
          prompt: 'Which keyword declares a variable you do **not** intend to reassign?',
          answer: ['const'],
          explain: 'Reach for `const` first and only switch to `let` when you actually reassign. It communicates intent to the next reader and makes accidental reassignment a compile-time error rather than a debugging session.',
        },
        {
          id: 'fd-cd-6',
          type: 'tf',
          prompt: 'A function stops running as soon as it hits a `return`.',
          answer: true,
          explain: 'Which is what makes "guard clauses" work: check the bad cases and return early, so the rest of the function only deals with the normal case and stops drifting rightwards into nested `if` blocks.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'found-debug',
      name: 'Reading errors and debugging',
      tier: 1,
      minutes: 12,
      lesson: {
        summary:
          'Debugging is the skill that separates people who progress from people who get stuck. It is a process, not a talent: read the message, find the line, form one guess, test it.',
        bullets: [
          'Read the error **top to bottom**: the type, the message, then the first line of the stack trace that points at *your* file.',
          'The three you will meet constantly: `undefined is not a function` (the thing is not what you think), `Cannot read properties of undefined (reading "x")` (something upstream is missing), and `Unexpected token` (a syntax typo - a missing bracket or comma).',
          'Open DevTools (F12): **Console** for errors and logs, **Network** for what your app actually sent and received, **Elements** for the live DOM.',
          'Change one thing at a time, then re-test. Changing three things means you learn nothing from the result.',
          '`console.log` is legitimate. Log the *value and its label*: `console.log("user:", user)`.',
          'A breakpoint (or the `debugger` statement) beats scattered logs once you need to inspect several values at once.',
          'Reduce it: delete code until the bug disappears. The last thing you removed is the culprit - and this is also how you write a good bug report.',
        ],
        code: {
          lang: 'js',
          src: `TypeError: Cannot read properties of undefined (reading 'name')
    at UserCard (UserCard.jsx:12:20)     <-- your file, your line
    at renderWithHooks (react-dom.js:...)  <-- library internals, skip

// line 12 was:
return <h3>{user.profile.name}</h3>;

// so: user exists, but user.profile is undefined.
// Ask WHY it is undefined, do not just silence it:
console.log('user:', user);              // is the API response shaped as expected?

// a fix, once you know it is legitimately optional:
return <h3>{user.profile?.name ?? 'Unknown'}</h3>;`,
        },
        gotchas: [
          'Reading only the last line of a stack trace - the useful line is usually the first one mentioning your own file.',
          'Fixing the symptom (`?.` everywhere) rather than asking why the data was missing.',
          'Assuming the error is in the framework. It is almost never in the framework.',
        ],
        interview: [
          'Walk me through how you debug something you have never seen before.',
          'What do you use browser DevTools for?',
          'Tell me about a bug that took you a long time to find.',
        ],
      },
      questions: [
        {
          id: 'fd-db-1',
          type: 'mcq',
          prompt: 'You see `Cannot read properties of undefined (reading "name")`. What does it tell you?',
          choices: [
            '`name` does not exist',
            'You tried to read `.name` from something that is `undefined` - the problem is one step earlier, in whatever should have produced that object',
            'The variable `name` was misspelled',
            'The server returned a 404',
          ],
          answer: 1,
          explain: 'The error names the *property you asked for*, not the thing that was missing. In `user.profile.name`, it means `user.profile` was undefined. Trace backwards to where that value came from - usually an API response with a different shape than you assumed.',
        },
        {
          id: 'fd-db-2',
          type: 'mcq',
          prompt: 'Your React app shows nothing and the request seems to fail. Which DevTools tab tells you what was actually sent and returned?',
          choices: ['Elements', 'Console', 'Network', 'Sources'],
          answer: 2,
          explain: 'The Network tab shows every request: URL, method, status code, headers, request payload and response body. Nine times out of ten it answers the question immediately - wrong URL, 401, CORS, or a response shaped differently than expected.',
        },
        {
          id: 'fd-db-3',
          type: 'mcq',
          prompt: 'Nothing works and you have made four changes. What is the best next step?',
          choices: [
            'Make a fifth change',
            'Undo back to a working state, then reapply one change at a time until it breaks',
            'Restart the computer',
            'Rewrite the file from scratch',
          ],
          answer: 1,
          explain: 'Bisecting. It is the same idea as `git bisect` on a commit history: cut the search space in half until only the culprit remains. Committing small and often is what makes this cheap.',
        },
        {
          id: 'fd-db-4',
          type: 'tf',
          prompt: 'When a stack trace lists dozens of lines, the useful one is usually the first that points at a file you wrote.',
          answer: true,
          explain: 'The frames above it are usually library internals reacting to your mistake. Source maps make this readable in a bundled app - which is why keeping them enabled in development matters.',
        },
        {
          id: 'fd-db-5',
          type: 'flash',
          prompt: 'Describe your process for debugging something you have never seen before.',
          answer: 'Reproduce it reliably first - if I cannot make it happen on demand I cannot tell whether I fixed it. Read the actual error message and the first stack frame in my own code rather than guessing. Check the obvious external facts: what the Network tab shows was sent and returned, what the data really looks like versus what I assumed. Form one hypothesis, change one thing, re-test. If I am lost, reduce the problem - comment out code or build the smallest snippet that still fails - or bisect recent commits to find when it broke. When I find it, I fix the cause rather than the symptom, and add a test so it cannot come back silently. If I am stuck for more than about half an hour, I ask, with the error, what I have already tried and a minimal reproduction.',
          explain: 'Interviewers ask this to hear a *method* rather than heroics. Mentioning "reproduce first", "one change at a time" and "ask for help with a reproduction" all score.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'found-tools',
      name: 'Terminal, editor and running code',
      tier: 1,
      minutes: 10,
      lesson: {
        summary:
          'You do not need to be a shell wizard, but you will live in a terminal every day. A dozen commands cover almost everything.',
        bullets: [
          'Navigate: `cd folder`, `cd ..` (up one), `ls` (or `dir` on Windows CMD), `pwd` (where am I).',
          'Paths: `./` is here, `../` is up one, `/` or `C:\\` is the root. A **relative** path depends on where you are; an **absolute** path does not.',
          'Run a Node project: `npm install` once, then `npm run dev`. Run a .NET project: `dotnet restore`, `dotnet run`.',
          '`Ctrl+C` stops a running process. "Port already in use" usually means an old one is still running.',
          'Your editor (VS Code, Rider, Visual Studio) gives you go-to-definition (F12), rename-symbol (F2), a debugger and an integrated terminal. Learning those four is worth hours a week.',
          'File extensions matter: `.js`, `.jsx`, `.ts`, `.tsx`, `.cs`, `.csproj`, `.json`, `.md`.',
          'Read the README of any repo you clone first - it tells you how to run the thing.',
        ],
        code: {
          lang: 'bash',
          src: `cd projects/my-app     # go into the folder
ls                     # what is in here
cat package.json       # read a file

npm install            # download dependencies listed in package.json
npm run dev            # start the dev server (script defined in package.json)
# Ctrl+C to stop it

dotnet run             # start a .NET project from its folder

git status             # what have I changed
git log --oneline -5   # the last five commits`,
        },
        gotchas: [
          '`npm install` must be run in the folder containing `package.json`, not above it.',
          '"command not found" means the tool is not installed or not on your PATH.',
          'Never commit `node_modules/` - it is generated from `package.json`, and it is enormous.',
        ],
        interview: [
          'How do you start a project you have just cloned?',
          'What does `npm install` do?',
          'What is the difference between a relative and an absolute path?',
        ],
      },
      questions: [
        {
          id: 'fd-tl-1',
          type: 'mcq',
          prompt: 'You just cloned a Node repo. What is the first command you run?',
          choices: ['`npm start`', '`npm install`', '`git push`', '`node index.js`'],
          answer: 1,
          explain: 'Dependencies are not committed - `package.json` lists them and `npm install` downloads them into `node_modules/`. Skipping it gives you "Cannot find module …" on the first run.',
        },
        {
          id: 'fd-tl-2',
          type: 'mcq',
          prompt: 'Why is `node_modules/` in `.gitignore`?',
          choices: [
            'It contains secrets',
            'It is generated from package.json, is huge, and differs per machine and OS',
            'Git cannot handle nested folders',
            'It is compiled output that must be rebuilt',
          ],
          answer: 1,
          explain: 'Anyone can reproduce it exactly with `npm ci` and the lockfile, so committing hundreds of megabytes of third-party code would only slow every clone down and create merge conflicts.',
        },
        {
          id: 'fd-tl-3',
          type: 'mcq',
          prompt: 'What does `cd ..` do?',
          choices: ['Lists files', 'Moves to the parent folder', 'Creates a folder', 'Returns to the home directory'],
          answer: 1,
          explain: '`..` means "the folder above this one" and `.` means "this folder", which is why you run a local script as `./script.sh`. `cd ~` (or just `cd` on Windows PowerShell) takes you home.',
        },
        {
          id: 'fd-tl-4',
          type: 'mcq',
          prompt: '"Port 3000 is already in use". What has usually happened?',
          choices: [
            'Your code has a bug',
            'A previous instance of the server is still running - stop it, or start on another port',
            'The port needs to be opened in your firewall',
            'Node is not installed',
          ],
          answer: 1,
          explain: 'Only one process can listen on a port. Find and stop the old one (`Ctrl+C` in its terminal, or `npx kill-port 3000`), or set `PORT=3001`. Nothing to do with your code.',
        },
        {
          id: 'fd-tl-5',
          type: 'tf',
          prompt: '`npm run dev` runs a script that the project itself defined in `package.json`.',
          answer: true,
          explain: 'The `scripts` block maps a name to a command, so every project can expose the same friendly verbs (`dev`, `build`, `test`) regardless of the tools underneath. Open `package.json` to see exactly what a script really runs.',
        },
      ],
    },
  ],
};
