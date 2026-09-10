export default {
  id: 'node',
  name: 'Node & Express',
  mark: 'ND',
  color: '#68a063',
  blurb: 'Server-side JavaScript: npm, the event loop under load, Express middleware, REST endpoints and the production concerns behind them.',
  modules: [
    /* ------------------------------------------------------------------ */
    {
      id: 'node-runtime',
      name: 'The runtime and npm',
      tier: 2,
      minutes: 14,
      lesson: {
        summary:
          'Node is V8 plus libuv plus a standard library. It gives JavaScript file system access, networking and processes, and it handles concurrency with an event loop rather than a thread per request.',
        bullets: [
          'One JS thread per process. libuv runs a small thread pool for file I/O, DNS and crypto; network I/O uses the OS event notification system.',
          'This model wins on I/O-bound work (a CRUD API waiting on a database) and loses on CPU-bound work, which blocks everything.',
          'CPU-heavy work goes to `worker_threads`, a child process, or a queue - never inline in a request handler.',
          '`package.json`: `dependencies` ship to production, `devDependencies` do not. `scripts` are your task runner.',
          'Semver ranges: `^1.2.3` allows 1.x.x (minor + patch), `~1.2.3` allows 1.2.x (patch only), `1.2.3` is exact.',
          '`package-lock.json` pins the exact resolved tree. Commit it, and use `npm ci` in CI for a clean, reproducible install.',
          'Config comes from environment variables (`process.env`), never from committed files. `.env` is for local development only.',
        ],
        code: {
          lang: 'js',
          src: `// blocking the only thread - every other request now waits
app.get('/report', (req, res) => {
  const total = hugeSyncCalculation();   // 4 seconds of CPU
  res.json({ total });
});

// non-blocking: hand it off
const { Worker } = require('node:worker_threads');

// npm essentials
// npm ci                 clean, lockfile-exact install (use in CI)
// npm install --save-dev vitest
// npm audit fix
// npx <tool>             run a package without installing it globally

process.env.PORT ?? 3000;`,
        },
        gotchas: [
          '`fs.readFileSync` in a request handler blocks every concurrent request in that process.',
          '`npm install` can update the lockfile; `npm ci` never does - that is why CI uses it.',
          'Anything in `dependencies` is downloaded on every production deploy; misplacing build tools there bloats images.',
        ],
        interview: [
          'Why is Node good for I/O-bound work and bad for CPU-bound work?',
          '`dependencies` vs `devDependencies`?',
          'What does `package-lock.json` do and should it be committed?',
        ],
      },
      questions: [
        {
          id: 'node-r-1',
          type: 'mcq',
          prompt: 'A request handler runs a 4-second synchronous loop. What is the impact on other users?',
          choices: [
            'None, Node spawns a thread per request',
            'Every other request on that process is blocked until the loop finishes',
            'Only requests to the same route are blocked',
            'Node kills the request automatically',
          ],
          answer: 1,
          explain: 'One JS thread means one blocked stack blocks everything - health checks included. Move it to `worker_threads`, a background job queue, or the database. This is the standard "why is Node bad at CPU work" question.',
        },
        {
          id: 'node-r-2',
          type: 'mcq',
          prompt: 'What does `^1.4.2` allow npm to install?',
          choices: ['Only 1.4.2', '1.4.x only', 'Any 1.x.x at or above 1.4.2', 'Any version at or above 1.4.2'],
          answer: 2,
          explain: 'Caret allows changes that do not modify the leftmost non-zero digit: minor and patch. Tilde `~1.4.2` allows patch only. (Below 1.0, caret is stricter: `^0.4.2` allows only 0.4.x.)',
        },
        {
          id: 'node-r-3',
          type: 'mcq',
          prompt: 'Why does CI use `npm ci` rather than `npm install`?',
          choices: [
            'It is an alias with a shorter name',
            'It installs exactly the lockfile tree, deletes `node_modules` first, and fails if package.json and the lock disagree',
            'It skips devDependencies',
            'It runs the test suite too',
          ],
          answer: 1,
          explain: 'Reproducibility. `npm install` may resolve new versions and rewrite the lockfile, so a build could differ from the one you tested. `npm ci` is also noticeably faster.',
        },
        {
          id: 'node-r-4',
          type: 'mcq',
          prompt: 'Where should a database connection string live?',
          choices: [
            'In `config.json`, committed to the repo',
            'In an environment variable, injected by the host/secret manager',
            'Hard-coded with a comment saying "change before deploy"',
            'In localStorage',
          ],
          answer: 1,
          explain: 'Environment variables (the 12-factor answer) keep secrets out of version control and let the same artifact run in dev, staging and prod. `.env` files are a local convenience and must be gitignored; production uses the platform\'s secret store.',
        },
        {
          id: 'node-r-5',
          type: 'tf',
          prompt: 'Node is multi-threaded under the hood, even though your JavaScript runs on one thread.',
          answer: true,
          explain: 'libuv maintains a thread pool (4 by default, `UV_THREADPOOL_SIZE`) for file I/O, DNS lookups, zlib and crypto. Network sockets do not use the pool - they use epoll/kqueue/IOCP. Getting this nuance right is a strong signal.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'node-express',
      name: 'Express, routing and middleware',
      tier: 3,
      minutes: 18,
      lesson: {
        summary:
          'Express is a middleware pipeline. A request walks through an ordered list of functions until one sends a response. Once you see it as a pipeline, ordering bugs stop being mysterious.',
        bullets: [
          'Middleware signature: `(req, res, next)`. Call `next()` to continue, send a response to stop, or `next(err)` to jump to error handling.',
          'Order matters: `app.use(express.json())` must come before any route that reads `req.body`.',
          'Error middleware has **four** parameters - `(err, req, res, next)` - and must be registered last.',
          'Route params `req.params.id`, query string `req.query.page`, body `req.body`, headers `req.headers`.',
          '`express.Router()` groups routes into mountable modules: `app.use("/api/users", usersRouter)`.',
          'Async handlers must forward rejections - wrap them, or use Express 5 which handles rejected promises natively.',
          'A REST CRUD set: `GET /users`, `GET /users/:id`, `POST /users`, `PUT/PATCH /users/:id`, `DELETE /users/:id`.',
        ],
        code: {
          lang: 'js',
          src: `const app = express();

app.use(express.json());          // parse JSON bodies - must be before routes
app.use(cors({ origin: allowed }));
app.use(helmet());

const router = express.Router();

router.get('/:id', asyncHandler(async (req, res) => {
  const user = await repo.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
}));

router.post('/', asyncHandler(async (req, res) => {
  const parsed = CreateUser.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.issues });
  const created = await repo.create(parsed.data);
  res.status(201).location('/api/users/' + created.id).json(created);
}));

app.use('/api/users', router);

// 404 then error handler, in that order, last
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status ?? 500).json({ error: 'Internal server error' });
});

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}`,
        },
        gotchas: [
          '`req.body` is `undefined` - you forgot `express.json()` or put it after the route.',
          'Calling `res.json()` twice throws "Cannot set headers after they are sent". Remember to `return`.',
          'A thrown error inside an async handler without a wrapper hangs the request until it times out.',
        ],
        interview: [
          'What is middleware and why does order matter?',
          'How do you handle errors centrally in Express?',
          'Which status codes do your CRUD endpoints return?',
        ],
      },
      questions: [
        {
          id: 'node-e-1',
          type: 'mcq',
          prompt: '`req.body` is `undefined` in your POST handler. Most likely cause?',
          choices: [
            'The client sent form data',
            '`express.json()` is missing, or registered after the route',
            'You need `body-parser` installed separately',
            'The route uses `app.post` instead of `router.post`',
          ],
          answer: 1,
          explain: 'Express does not parse bodies by default. `express.json()` has been built in since 4.16, so the separate `body-parser` package is no longer needed. And because middleware is ordered, registering it after the route means it never runs for that route.',
        },
        {
          id: 'node-e-2',
          type: 'mcq',
          prompt: 'How does Express recognise an error-handling middleware?',
          choices: [
            'By the name `errorHandler`',
            'By its arity - it takes four parameters `(err, req, res, next)`',
            'By calling `app.error()`',
            'By throwing inside it',
          ],
          answer: 1,
          explain: 'Express inspects `fn.length`. Two consequences: you must declare all four parameters even if `next` is unused, and the handler must be registered *after* your routes so errors can reach it.',
        },
        {
          id: 'node-e-3',
          type: 'mcq',
          prompt: 'What should `POST /api/users` return on success?',
          choices: [
            '`200 OK` with an empty body',
            '`201 Created`, the new resource, and a `Location` header pointing at it',
            '`204 No Content`',
            '`302 Found`',
          ],
          answer: 1,
          explain: '201 + Location is the REST convention for creation. 200 is for a successful read or a non-creating action; 204 means success with deliberately no body (typical for DELETE); 302 is a redirect.',
        },
        {
          id: 'node-e-4',
          type: 'mcq',
          prompt: 'An async route handler rejects and the request hangs forever. Why?',
          choices: [
            'Express 4 does not catch rejected promises returned from handlers, so `next(err)` is never called',
            'Node crashed',
            'The client timed out first',
            'You must use callbacks in Express',
          ],
          answer: 0,
          explain: 'Wrap handlers in a helper that does `.catch(next)`, use `express-async-errors`, or move to Express 5 which forwards rejections automatically. Interviewers ask this to see whether you have run an Express app in anger.',
        },
        {
          id: 'node-e-5',
          type: 'mcq',
          prompt: 'Which correctly reads the id from `GET /users/42?expand=orders`?',
          choices: [
            '`req.body.id` and `req.body.expand`',
            '`req.params.id` and `req.query.expand`',
            '`req.query.id` and `req.params.expand`',
            '`req.headers.id`',
          ],
          answer: 1,
          explain: 'Path segments declared as `:id` land in `req.params`; everything after `?` is in `req.query`. Note both are strings - `req.params.id` is `"42"`, so coerce and validate before using it.',
        },
        {
          id: 'node-e-6',
          type: 'multi',
          prompt: 'Which belong in an Express middleware chain for a production API?',
          choices: [
            '`helmet()` for security headers',
            '`cors()` with an explicit allow-list',
            'A request logger such as pino-http or morgan',
            'Rate limiting on auth endpoints',
            'A `console.log` of every request body including passwords',
          ],
          answer: [0, 1, 2, 3],
          explain: 'Logging request bodies wholesale leaks credentials and personal data into your log store - a genuine compliance incident. Real loggers support redaction paths for exactly this reason.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'node-api',
      name: 'Building the CRUD API',
      tier: 3,
      minutes: 16,
      lesson: {
        summary:
          'The shape of a real Node API: layers, validation at the edge, consistent errors, and talking to a database without leaking connections.',
        bullets: [
          'Layer it: **route** (HTTP concerns) -> **service** (business rules) -> **repository/data access**. Keep `req`/`res` out of the service layer so it stays testable.',
          'Validate input at the boundary with a schema (Zod/Joi) and return `400` with field-level errors. Never trust the client.',
          'Use a connection **pool**, created once at startup - not a new connection per request.',
          'Always use parameterised queries. String concatenation into SQL is how injection happens.',
          'Return consistent error bodies: a stable `code`, a human `message`, and validation `details`. Never leak stack traces to clients.',
          'Pagination from day one: `?page=&limit=` or cursor-based, with a sane maximum limit.',
          'Idempotency: `PUT` and `DELETE` should be safe to retry; `POST` is not, which is why payment APIs use idempotency keys.',
        ],
        code: {
          lang: 'js',
          src: `// pool created once, shared
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 });

// parameterised - the driver sends values separately from the SQL text
const { rows } = await pool.query(
  'SELECT id, name FROM users WHERE email = $1',
  [email]
);

// layers
// routes/users.js   -> parses/validates, maps errors to status codes
// services/users.js -> business rules, transactions
// repos/users.js    -> SQL only

class AppError extends Error {
  constructor(message, status = 400, code = 'BAD_REQUEST') {
    super(message);
    this.status = status;
    this.code = code;
  }
}`,
        },
        gotchas: [
          'Opening a client per request exhausts the database connection limit under load.',
          'Returning `err.message` to the client can expose table names and file paths.',
          '`SELECT *` couples your API response to your schema - list columns explicitly.',
        ],
        interview: [
          'How do you structure an Express project?',
          'How do you prevent SQL injection?',
          'What does your error response body look like?',
        ],
      },
      questions: [
        {
          id: 'node-a-1',
          type: 'mcq',
          prompt: 'Which prevents SQL injection?',
          choices: [
            'Escaping quotes in the input string',
            'Parameterised queries / prepared statements, where values are sent separately from the SQL text',
            'Validating that the input is not empty',
            'Using HTTPS',
          ],
          answer: 1,
          explain: 'With parameters the query plan is fixed before values arrive, so a value can never become syntax. Hand-rolled escaping fails on encoding edge cases. ORMs parameterise by default - but their raw-SQL escape hatches do not.',
        },
        {
          id: 'node-a-2',
          type: 'mcq',
          prompt: 'Why create the database pool once at startup rather than per request?',
          choices: [
            'It uses less memory in the JS heap',
            'Connections are expensive to establish and the database has a hard connection limit; a pool reuses a bounded set',
            'Pools cache query results',
            'It is required by the driver',
          ],
          answer: 1,
          explain: 'A TCP connect plus auth plus TLS handshake per request adds latency and will exhaust `max_connections` under load. Pool size should be tuned against the database limit divided by the number of app instances.',
        },
        {
          id: 'node-a-3',
          type: 'mcq',
          prompt: 'A request body fails validation. What do you return?',
          choices: [
            '`500` with the exception message',
            '`400 Bad Request` with a structured list of the offending fields',
            '`404 Not Found`',
            '`200` with `{ ok: false }`',
          ],
          answer: 1,
          explain: '4xx means "the client can fix this"; 5xx means "the server broke". Returning 200 for failures makes clients parse bodies to detect errors and defeats monitoring. 422 is also defensible for semantic validation failures.',
        },
        {
          id: 'node-a-4',
          type: 'mcq',
          prompt: 'Why keep `req` and `res` out of the service layer?',
          choices: [
            'Performance',
            'So business logic can be unit-tested and reused from a CLI, a job or a queue consumer without faking HTTP',
            'Express forbids it',
            'To reduce bundle size',
          ],
          answer: 1,
          explain: 'A service that takes plain arguments and throws typed errors is trivially testable. The route layer becomes a thin adapter that maps input to arguments and errors to status codes. This layering question comes up in almost every backend interview.',
        },
        {
          id: 'node-a-5',
          type: 'mcq',
          prompt: 'Which HTTP methods should be safe to retry (idempotent)?',
          choices: [
            '`POST` and `GET`',
            '`GET`, `PUT`, `DELETE` (and `HEAD`)',
            'All of them',
            'None - retries are always unsafe',
          ],
          answer: 1,
          explain: 'Repeating `PUT /users/1` with the same body leaves the same final state; repeating `DELETE` leaves it deleted (a second call returning 404 or 204 is still idempotent). `POST` creates each time, which is why retry-prone systems use idempotency keys.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'node-prod',
      name: 'Auth, security and running in production',
      tier: 4,
      minutes: 16,
      lesson: {
        summary:
          'The questions that separate "I built a tutorial app" from "I have shipped one": authentication, secrets, logging and what happens when the process dies.',
        bullets: [
          '**Authentication** is who you are; **authorisation** is what you may do. Interviewers check you do not conflate them.',
          'Never store raw passwords. Hash with **bcrypt**, **scrypt** or **Argon2** - slow, salted algorithms. SHA-256 is far too fast.',
          'A JWT is signed, not encrypted: anyone can read the payload. It cannot be revoked before expiry, so keep access tokens short-lived and pair them with a refresh token you *can* revoke.',
          'Sessions (a random id in an httpOnly cookie, state on the server) are simpler and revocable - the right default for a single web app.',
          'Always validate and authorise on the server. Hiding a button is UI, not security.',
          'Log structured JSON with a correlation id per request; redact secrets. Send errors to something like Sentry.',
          'A crashed Node process must be restarted by something else - a container orchestrator, systemd, or PM2. Add a `/health` endpoint.',
          'Graceful shutdown: on `SIGTERM`, stop accepting connections, finish in-flight requests, close the pool.',
        ],
        code: {
          lang: 'js',
          src: `const hash = await bcrypt.hash(password, 12);          // cost factor, not a salt
const ok   = await bcrypt.compare(password, user.hash);

// authorise on the server, every time
router.delete('/:id', requireAuth, async (req, res) => {
  const doc = await repo.findById(req.params.id);
  if (!doc) return res.status(404).end();
  if (doc.ownerId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await repo.remove(doc.id);
  res.status(204).end();
});

process.on('SIGTERM', async () => {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
});`,
        },
        gotchas: [
          'Returning "user not found" vs "wrong password" tells an attacker which emails exist. Use one generic message.',
          'Putting a JWT in localStorage exposes it to any XSS on the page.',
          '`401` means not authenticated; `403` means authenticated but not allowed. They are routinely mixed up.',
        ],
        interview: [
          'Authentication vs authorisation?',
          'How do you store passwords?',
          'JWT vs session cookies - trade-offs?',
        ],
      },
      questions: [
        {
          id: 'node-p-1',
          type: 'mcq',
          prompt: 'Which is the right way to store user passwords?',
          choices: [
            'AES-encrypt them so they can be recovered',
            'A slow, salted hash: bcrypt, scrypt or Argon2',
            'SHA-256 with a salt',
            'Plain text behind a firewall',
          ],
          answer: 1,
          explain: 'Passwords must be one-way - you never need the original. SHA-256 is designed to be fast, so a GPU tries billions per second; bcrypt/scrypt/Argon2 have a tunable cost factor and generate a per-user salt automatically. Recoverable encryption is a breach waiting to happen.',
        },
        {
          id: 'node-p-2',
          type: 'mcq',
          prompt: 'A user is logged in but tries to delete someone else\'s record. Correct status code?',
          choices: ['`401 Unauthorized`', '`403 Forbidden`', '`400 Bad Request`', '`404 Not Found`'],
          answer: 1,
          explain: '401 means "I do not know who you are" (missing or invalid credentials); 403 means "I know who you are and you may not". Some APIs deliberately return 404 instead of 403 to avoid confirming the resource exists - a valid trade-off to mention.',
        },
        {
          id: 'node-p-3',
          type: 'mcq',
          prompt: 'What is the main operational drawback of stateless JWTs?',
          choices: [
            'They are slow to verify',
            'You cannot revoke one before it expires without adding server-side state (a denylist or short TTL + refresh tokens)',
            'They cannot carry user data',
            'They only work over HTTP/2',
          ],
          answer: 1,
          explain: 'The scaling benefit - no session lookup - is exactly what removes your ability to log someone out. The usual answer is 5-15 minute access tokens plus a revocable refresh token, which quietly reintroduces server state.',
        },
        {
          id: 'node-p-4',
          type: 'tf',
          prompt: 'A JWT payload is encrypted, so it is safe to put a user\'s personal data in it.',
          answer: false,
          explain: 'A standard JWT is base64url-encoded and *signed*, not encrypted - anyone holding the token can read every claim (paste one into jwt.io). Signing guarantees integrity, not confidentiality. Encryption requires JWE.',
        },
        {
          id: 'node-p-5',
          type: 'mcq',
          prompt: 'Your Node process crashes at 3am. What is supposed to bring it back?',
          choices: [
            'Node restarts itself automatically',
            'A supervisor outside the process: the container orchestrator, systemd or PM2 - plus alerting on the health check',
            'A `try/catch` around the whole app',
            'The load balancer',
          ],
          answer: 1,
          explain: 'A process cannot reliably resurrect itself. Let it crash on an unknown error (the state may be corrupt) and have the platform restart it - "crash-only design". `uncaughtException` should log and exit, not attempt to continue.',
        },
        {
          id: 'node-p-6',
          type: 'flash',
          prompt: 'How would you handle a login form end to end, securely?',
          answer: 'Serve over HTTPS only. Rate-limit the endpoint per IP and per account to blunt credential stuffing. Look up the user, compare with bcrypt.compare (constant-time by design), and return one generic "invalid email or password" for both failure cases so accounts cannot be enumerated. On success, issue a session: a random id in an httpOnly, Secure, SameSite=Lax cookie, or a short-lived JWT plus a revocable refresh token. Never log the password or the token. Store only the hash - no reversible encryption. Add lockout or exponential backoff after repeated failures, and log the attempt with a correlation id for auditing. Server-side authorisation on every subsequent request, not just at login.',
          explain: 'Points to hit: HTTPS, rate limiting, generic error message, bcrypt/Argon2, httpOnly cookie, no logging of secrets, server-side authorisation.',
        },
      ],
    },
  ],
};
