export default {
  id: 'web',
  name: 'Web & HTTP',
  mark: 'WW',
  color: '#ff7847',
  blurb: 'What actually happens between the browser and your API: methods, status codes, CORS, caching, and the security questions every interview includes.',
  modules: [
    /* ------------------------------------------------------------------ */
    {
      id: 'web-http',
      name: 'HTTP fundamentals',
      tier: 2,
      minutes: 14,
      lesson: {
        summary:
          'HTTP is a stateless request/response protocol. "What happens when you type a URL and press enter?" is asked at every level - this module is the answer.',
        bullets: [
          'The journey: DNS lookup -> TCP connect -> TLS handshake -> HTTP request -> server response -> parse HTML -> fetch CSS/JS/images -> render -> run JS.',
          'Methods: `GET` (read, safe), `POST` (create/act), `PUT` (replace), `PATCH` (partial update), `DELETE`. **Safe** = no side effects; **idempotent** = repeating it changes nothing further.',
          'Status families: 1xx info, **2xx success**, **3xx redirect**, **4xx client error**, **5xx server error**.',
          'Worth memorising: 200, 201, 204, 301 vs 302, 304, 400, 401, 403, 404, 409, 422, 429, 500, 502, 503.',
          'Headers carry the metadata: `Content-Type`, `Authorization`, `Accept`, `Cache-Control`, `Set-Cookie`, `ETag`.',
          'HTTP is stateless - the server does not remember you between requests. Cookies, tokens and sessions are how state is reconstructed.',
          'HTTP/2 multiplexes many requests over one connection, which is why bundling everything into one file matters less than it used to.',
        ],
        code: {
          lang: 'http',
          src: `POST /api/orders HTTP/1.1
Host: api.shop.com
Content-Type: application/json
Authorization: Bearer eyJhbGciOi...

{"productId":"abc","quantity":2}

HTTP/1.1 201 Created
Location: /api/orders/98f1
Content-Type: application/json

{"id":"98f1","status":"pending"}`,
        },
        gotchas: [
          '401 = not authenticated, 403 = authenticated but not permitted. Constantly swapped.',
          '301 is permanent and aggressively cached by browsers - hard to undo. Use 302/307 while unsure.',
          '`GET` requests must not change state; search engines and prefetchers will call them.',
        ],
        interview: [
          'What happens when you type a URL and press enter?',
          'Difference between PUT and PATCH?',
          'When do you return 401 vs 403 vs 404?',
        ],
      },
      questions: [
        {
          id: 'web-h-1',
          type: 'mcq',
          prompt: 'Which pair is correct?',
          choices: [
            '401 = forbidden, 403 = unauthorized',
            '401 = not authenticated (who are you?), 403 = authenticated but not allowed',
            'Both mean the same thing',
            '401 = server error, 403 = client error',
          ],
          answer: 1,
          explain: 'The HTTP spec unhelpfully *names* 401 "Unauthorized" when it means unauthenticated. 401 usually comes with a `WWW-Authenticate` header inviting you to log in; 403 means logging in again will not help.',
        },
        {
          id: 'web-h-2',
          type: 'mcq',
          prompt: 'PUT vs PATCH?',
          choices: [
            'PUT creates, PATCH updates',
            'PUT replaces the whole resource; PATCH applies a partial update',
            'PATCH is not idempotent by definition',
            'They are aliases',
          ],
          answer: 1,
          explain: 'Sending a PUT with only one field means the omitted fields should be cleared. PATCH sends just the delta. Both are typically idempotent in practice, though PATCH is not required to be.',
        },
        {
          id: 'web-h-3',
          type: 'mcq',
          prompt: 'Which status code fits "the request was well formed but conflicts with the current state" - e.g. that email is already registered?',
          choices: ['`400`', '`409 Conflict`', '`422`', '`500`'],
          answer: 1,
          explain: '409 signals a state conflict, which the client may resolve by changing something. 400 is malformed syntax; 422 is well-formed but semantically invalid; 500 means *you* broke, not them.',
        },
        {
          id: 'web-h-4',
          type: 'mcq',
          prompt: 'Your API is behind a load balancer and users report intermittent `502 Bad Gateway`. What does that mean?',
          choices: [
            'The client sent bad data',
            'The proxy reached your upstream but got an invalid or no response - the app is crashing, timing out, or not listening',
            'The URL does not exist',
            'Rate limiting kicked in',
          ],
          answer: 1,
          explain: '502 is the gateway blaming the upstream; 503 means the service is unavailable/overloaded; 504 is an upstream timeout. Knowing which layer emits which code makes production debugging much quicker.',
        },
        {
          id: 'web-h-5',
          type: 'flash',
          prompt: 'What happens when you type a URL and press enter?',
          answer: 'The browser resolves the hostname via DNS (checking its own cache, the OS cache, then a resolver). It opens a TCP connection to the resulting IP - and for HTTPS performs a TLS handshake, negotiating a cipher and validating the certificate chain. It sends an HTTP request with headers such as Host, Accept and any cookies for that origin. The server - possibly via a CDN, load balancer and reverse proxy - routes the request, runs the application, and returns a status, headers and body. The browser parses the HTML into a DOM, discovers stylesheets, scripts and images and fetches them (render-blocking CSS, deferred/async JS), builds the CSSOM, computes layout, paints, and composites. Then JavaScript runs, hydrates or bootstraps the app, and typically makes further XHR/fetch calls for data. Caching can short-circuit almost any of these steps.',
          explain: 'A very common opening question. Interviewers listen for DNS, TCP/TLS, request/response, parse/render, and JS execution - and for you to pick a layer to go deeper on.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'web-rest',
      name: 'REST APIs, CORS and caching',
      tier: 3,
      minutes: 16,
      lesson: {
        summary:
          'Designing an API other people can use, and the browser rules that will bite you the first time your React app calls your .NET server.',
        bullets: [
          'REST: resources as nouns (`/users/42/orders`), verbs as HTTP methods, statelessness, and meaningful status codes.',
          'Plural nouns, no verbs in the path. `POST /users` not `/createUser`.',
          'Return created resources with `201` + `Location`. Use `204` for a successful delete with no body.',
          'Version deliberately: `/api/v1/...` or a header. Breaking a public contract without a version is how you lose a Friday.',
          '**CORS** is a browser rule: a page on origin A may not read a response from origin B unless B opts in with `Access-Control-Allow-Origin`. Origin = scheme + host + port.',
          'Non-simple requests (custom headers, `PUT`/`DELETE`, JSON content type) trigger a **preflight** `OPTIONS` request first.',
          'CORS does not protect your server - anything not a browser can call your API. It protects users from their own credentials being used cross-site.',
          'Caching: `Cache-Control: max-age`/`no-store`, plus `ETag`/`If-None-Match` for revalidation returning `304 Not Modified`.',
        ],
        code: {
          lang: 'http',
          src: `# preflight sent by the browser before the real request
OPTIONS /api/orders HTTP/1.1
Origin: https://app.shop.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type, authorization

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.shop.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: content-type, authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 600

# conditional GET
GET /api/products/1
If-None-Match: "v3"
-> 304 Not Modified   (no body, saves bandwidth)`,
        },
        gotchas: [
          '`Access-Control-Allow-Origin: *` cannot be combined with credentials - you must echo the specific origin.',
          'A CORS error in the console often hides a 500: the server threw before adding the CORS headers.',
          'Caching an authenticated response publicly leaks one user\'s data to another. Use `Cache-Control: private`.',
        ],
        interview: [
          'What is CORS and why does it exist?',
          'How do you version an API?',
          'What makes an API RESTful?',
        ],
      },
      questions: [
        {
          id: 'web-r-1',
          type: 'mcq',
          prompt: 'Your React app on `localhost:5173` calls an API on `localhost:5000` and the browser blocks it. What is happening?',
          choices: [
            'The API is down',
            'Different ports mean different origins, so CORS applies - the API must send `Access-Control-Allow-Origin`',
            'You need HTTPS',
            'React cannot make cross-origin requests',
          ],
          answer: 1,
          explain: 'An origin is scheme + host + **port**, so 5173 and 5000 differ. Fix it on the server (`app.UseCors(...)` / `cors()` middleware) or route through the dev server proxy. Note the request usually still reaches your server - the browser blocks *reading the response*.',
        },
        {
          id: 'web-r-2',
          type: 'mcq',
          prompt: 'Why does the browser send an `OPTIONS` request before your `POST` with a JSON body and an auth header?',
          choices: [
            'To check the server is alive',
            'It is a CORS preflight asking permission for the method and headers before sending the real request',
            'To negotiate HTTP/2',
            'To fetch the CSRF token',
          ],
          answer: 1,
          explain: 'Only "simple" requests skip preflight (GET/HEAD/POST with a form or text content type and no custom headers). `Access-Control-Max-Age` lets the browser cache the preflight so it is not repeated on every call.',
        },
        {
          id: 'web-r-3',
          type: 'tf',
          prompt: 'CORS protects your API from being called by malicious servers.',
          answer: false,
          explain: 'CORS is enforced by the browser, for browsers. curl, Postman, a mobile app or another server can call your API freely. It exists to stop a random site reading responses from an API where the user is already logged in. Real protection is authentication, authorisation and rate limiting.',
        },
        {
          id: 'web-r-4',
          type: 'mcq',
          prompt: 'Which endpoint design is the most RESTful?',
          choices: [
            '`POST /getUserOrders?userId=42`',
            '`GET /users/42/orders`',
            '`GET /api/doAction?type=orders&user=42`',
            '`POST /orders/list`',
          ],
          answer: 1,
          explain: 'Resources are nouns arranged hierarchically; the method supplies the verb. That also makes it cacheable, safe to retry, and linkable. Note that some genuinely action-shaped operations (`POST /orders/42/cancel`) are pragmatic and fine to defend.',
        },
        {
          id: 'web-r-5',
          type: 'mcq',
          prompt: 'What does an `ETag` do?',
          choices: [
            'Compresses the response',
            'Identifies a version of the resource so the client can send `If-None-Match` and get a cheap `304 Not Modified`',
            'Encrypts the payload',
            'Sets the cache duration',
          ],
          answer: 1,
          explain: 'Revalidation without re-downloading. The same header also powers optimistic concurrency for writes: send `If-Match: "v3"` on a PUT and the server returns `412 Precondition Failed` if someone else changed it first.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'web-sec',
      name: 'Web security essentials',
      tier: 4,
      minutes: 16,
      lesson: {
        summary:
          'You will be asked about XSS, CSRF and SQL injection in some form. Knowing the mechanism, not just the acronym, is what counts.',
        bullets: [
          '**XSS**: attacker-controlled script runs on your page. Defence: escape on output (React does by default), avoid `innerHTML`, sanitise any HTML you must render, and set a Content-Security-Policy.',
          '**CSRF**: a third-party page makes the user\'s browser send an authenticated request to your site. Defence: `SameSite` cookies, anti-forgery tokens, and checking Origin. Only affects credentials the browser attaches automatically - cookies.',
          '**SQL injection**: input becomes SQL syntax. Defence: parameterised queries, always.',
          '**IDOR / broken access control**: `/api/orders/1234` returns someone else\'s order. Defence: authorise every request against the *current user*, not just authenticate.',
          'Never trust the client. Hidden fields, disabled buttons and client-side validation are UX, not security.',
          'HTTPS everywhere, secrets out of source control, dependencies patched (`npm audit`, Dependabot).',
          'The OWASP Top 10 is the canonical list - broken access control has been number one for years.',
        ],
        code: {
          lang: 'js',
          src: `// XSS: never interpolate untrusted input into markup
el.innerHTML = '<p>' + comment + '</p>';        // vulnerable
el.textContent = comment;                        // safe

// React escapes by default
<p>{comment}</p>                                 // safe
<p dangerouslySetInnerHTML={{ __html: comment }} />   // only with sanitised HTML

// SQL injection
db.query('SELECT * FROM users WHERE email = "' + email + '"');   // vulnerable
db.query('SELECT * FROM users WHERE email = $1', [email]);       // safe

// broken access control - authenticate AND authorise
const order = await repo.find(id);
if (order.userId !== req.user.id) return res.status(403).end();`,
        },
        gotchas: [
          'Client-side validation only means an attacker just uses curl.',
          'A CSP with `unsafe-inline` gives up most of its protection.',
          '"We are behind a VPN" is not authorisation.',
        ],
        interview: [
          'Explain XSS and how you prevent it.',
          'XSS vs CSRF - what is the difference?',
          'How do you prevent SQL injection?',
        ],
      },
      questions: [
        {
          id: 'web-s-1',
          type: 'mcq',
          prompt: 'What is the core difference between XSS and CSRF?',
          choices: [
            'They are the same attack with different names',
            'XSS runs attacker script in your page; CSRF makes the user\'s browser send a legitimate-looking authenticated request from another site',
            'XSS targets servers, CSRF targets databases',
            'CSRF only affects GET requests',
          ],
          answer: 1,
          explain: 'XSS breaks confidentiality and integrity inside your origin - and it defeats every CSRF defence, because the script is already running as the user. CSRF relies on the browser auto-attaching cookies, which is why `SameSite=Lax` (now the browser default) removed most of it.',
        },
        {
          id: 'web-s-2',
          type: 'mcq',
          prompt: 'Which single measure prevents SQL injection?',
          choices: [
            'Escaping quotes in user input',
            'Parameterised queries / prepared statements',
            'A web application firewall',
            'Validating input length',
          ],
          answer: 1,
          explain: 'Parameters keep data out of the SQL grammar entirely, so no input can become syntax. The others are useful defence in depth but each has bypasses. ORMs parameterise by default - the risk lives in their raw-SQL escape hatches and in dynamic `ORDER BY` clauses.',
        },
        {
          id: 'web-s-3',
          type: 'mcq',
          prompt: '`GET /api/invoices/1005` returns another customer\'s invoice to a logged-in user. What is this?',
          choices: [
            'XSS',
            'Broken access control (IDOR) - the request is authenticated but never authorised against the current user',
            'CSRF',
            'A caching bug',
          ],
          answer: 1,
          explain: 'Number one in the OWASP Top 10. Authentication proves who they are; every handler must still check that *this* user may see *this* record. Using unguessable ids helps, but it is obscurity, not a control.',
        },
        {
          id: 'web-s-4',
          type: 'multi',
          prompt: 'Which are real defences against XSS?',
          choices: [
            'Escaping/encoding data on output',
            'Using `textContent` instead of `innerHTML`',
            'A Content-Security-Policy that blocks inline scripts',
            'Sanitising HTML with a library such as DOMPurify',
            'Hiding the API endpoints from the JS bundle',
          ],
          answer: [0, 1, 2, 3],
          explain: 'Nothing in a bundle shipped to the browser is hidden - assume every endpoint, key name and feature flag in your front-end code is public. Security must be enforced server-side.',
        },
        {
          id: 'web-s-5',
          type: 'mcq',
          prompt: 'A form disables the submit button for non-admins. Is the action protected?',
          choices: [
            'Yes, they cannot click it',
            'No - anyone can call the endpoint directly; authorisation must be enforced on the server',
            'Yes, if the button is also hidden',
            'Only if the app uses HTTPS',
          ],
          answer: 1,
          explain: 'The client is fully under the attacker\'s control - DevTools, curl, a replayed request. UI state is a convenience for honest users. Every mutating endpoint checks the caller\'s permissions itself.',
        },
      ],
    },
  ],
};
