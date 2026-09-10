export default {
  id: 'dotnet',
  name: '.NET & ASP.NET Core',
  mark: '.N',
  color: '#6f4bd8',
  blurb: 'The platform, the request pipeline, dependency injection lifetimes and EF Core - the back-end half of a CRUD job.',
  modules: [
    /* ------------------------------------------------------------------ */
    {
      id: 'dotnet-platform',
      name: 'The platform and the CLI',
      tier: 2,
      minutes: 12,
      lesson: {
        summary:
          'Know the difference between .NET Framework, .NET Core and modern .NET, and be able to drive the CLI. This is the "have you actually used it" filter.',
        bullets: [
          '.NET Framework (up to 4.8) is Windows-only and in maintenance. .NET Core became just **.NET** at version 5; .NET 8 and 10 are LTS, .NET 9 is STS.',
          'Modern .NET is cross-platform, open source, and much faster; new work starts there.',
          'Your C# compiles to **IL** in an assembly (`.dll`), which the CLR JIT-compiles to machine code at runtime. The GC manages memory.',
          '`.csproj` is the project file: target framework, NuGet `PackageReference`s, project references. A `.sln` groups projects.',
          'CLI basics: `dotnet new`, `dotnet restore`, `dotnet build`, `dotnet run`, `dotnet test`, `dotnet publish -c Release`, `dotnet add package`.',
          'A typical solution: `Api` (web), `Application`/`Services` (business logic), `Infrastructure` (data access), `Domain` (models), plus test projects.',
        ],
        code: {
          lang: 'bash',
          src: `dotnet new webapi -n Shop.Api
dotnet new classlib -n Shop.Domain
dotnet sln add Shop.Api Shop.Domain
dotnet add Shop.Api reference Shop.Domain
dotnet add Shop.Api package Microsoft.EntityFrameworkCore.SqlServer

dotnet run --project Shop.Api
dotnet test
dotnet publish -c Release -o ./publish`,
        },
        gotchas: [
          '"Should we target .NET Framework?" - only for legacy Windows-only dependencies (WCF server, old WinForms).',
          '`dotnet build` restores by default now; an explicit `dotnet restore` is rarely needed.',
          'Trying to run a `Debug` build in production loses significant JIT optimisation.',
        ],
        interview: [
          '.NET Framework vs .NET Core vs .NET 8?',
          'What does the CLR do?',
          'How would you lay out a solution for a CRUD API?',
        ],
      },
      questions: [
        {
          id: 'dn-pl-1',
          type: 'mcq',
          prompt: 'Which statement is accurate?',
          choices: [
            '.NET Framework 4.8 is the newest version and runs on Linux',
            'Modern .NET (5+) is the cross-platform successor; .NET Framework is Windows-only and in maintenance mode',
            '.NET Core and .NET Framework are the same product',
            '.NET 8 only runs on Windows Server',
          ],
          answer: 1,
          explain: 'The naming is the trap: .NET Core 3.1 was followed by .NET 5 (the "Core" was dropped). Even-numbered releases are LTS (3 years of support); odd ones are STS (18 months).',
        },
        {
          id: 'dn-pl-2',
          type: 'mcq',
          prompt: 'What does the CLR do at runtime?',
          choices: [
            'Interprets C# source directly',
            'Loads assemblies, JIT-compiles IL to native code, and manages memory with a garbage collector',
            'Transpiles C# to C++',
            'Only handles exceptions',
          ],
          answer: 1,
          explain: 'C# compiles to IL ahead of time; the CLR JITs each method on first call (with tiered compilation promoting hot paths). It also provides type safety, exception handling and the GC. AOT publishing skips the JIT for faster startup.',
        },
        {
          id: 'dn-pl-3',
          type: 'short',
          prompt: 'Which CLI command adds a NuGet package to a project?',
          answer: ['dotnet add package', 'dotnet add package <name>'],
          explain: '`dotnet add package Serilog.AspNetCore` writes a `PackageReference` into the `.csproj` and restores it. Versions are pinned in the csproj and locked more tightly with `packages.lock.json` if you enable it.',
        },
        {
          id: 'dn-pl-4',
          type: 'mcq',
          prompt: 'Why split a solution into Api / Application / Infrastructure / Domain projects?',
          choices: [
            'It compiles faster',
            'To enforce dependency direction - business logic does not reference the web or database layers, so it stays testable and swappable',
            'Visual Studio requires it',
            'To reduce the DLL size',
          ],
          answer: 1,
          explain: 'Project references are compile-time enforced, so the architecture cannot quietly rot. This is the "clean/onion architecture" answer; for a small CRUD app a single well-organised project is perfectly defensible too - saying so shows judgement.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'dotnet-aspnet',
      name: 'ASP.NET Core: pipeline, DI and configuration',
      tier: 3,
      minutes: 20,
      lesson: {
        summary:
          'ASP.NET Core is a middleware pipeline plus a dependency injection container. Middleware order and DI lifetimes are the two most-asked topics in .NET interviews.',
        bullets: [
          'Middleware runs in registration order on the way in and in reverse on the way out. `UseAuthentication` must precede `UseAuthorization`, and both must follow `UseRouting`.',
          'DI lifetimes: **Transient** (new every resolution), **Scoped** (one per HTTP request), **Singleton** (one for the app lifetime).',
          'Injecting a Scoped service into a Singleton is a **captive dependency** - the container throws in development. A `DbContext` is Scoped for good reason.',
          'Controllers vs Minimal APIs: controllers give filters, model binding conventions and familiarity; minimal APIs are lighter and now support filters and validation too. Both are fine answers.',
          'Model binding maps route values, query string, body, headers and form into action parameters. `[ApiController]` makes model validation automatic (400 on invalid state).',
          'Configuration layers in order: appsettings.json, appsettings.{Environment}.json, user secrets (dev), environment variables, command line - later wins. Bind sections to typed options with `IOptions<T>`.',
          'Return `Results`/`ActionResult` helpers so status codes are explicit: `Ok`, `Created`, `NoContent`, `NotFound`, `BadRequest`, `Problem`.',
        ],
        code: {
          lang: 'csharp',
          src: `var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseSqlServer(builder.Configuration.GetConnectionString("Default")));   // Scoped
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddSingleton<IClock, SystemClock>();
builder.Services.Configure<MailOptions>(builder.Configuration.GetSection("Mail"));
builder.Services.AddControllers();

var app = builder.Build();

app.UseExceptionHandler("/error");
app.UseHttpsRedirection();
app.UseCors("spa");
app.UseAuthentication();     // who are you
app.UseAuthorization();      // are you allowed
app.MapControllers();
app.Run();

// minimal API equivalent
app.MapGet("/api/users/{id:guid}", async (Guid id, IUserRepository repo, CancellationToken ct) =>
    await repo.FindAsync(id, ct) is { } user ? Results.Ok(user) : Results.NotFound());`,
        },
        gotchas: [
          'Registering `AddScoped` for something that holds no state is harmless; registering a `DbContext` as Singleton is a data-corruption bug.',
          'Middleware placed after `MapControllers` never runs for matched routes.',
          'Secrets in appsettings.json get committed. Use user secrets locally and environment variables in production.',
        ],
        interview: [
          'Explain the three DI lifetimes and give an example of each.',
          'What happens if you inject a Scoped service into a Singleton?',
          'Why does middleware order matter?',
        ],
      },
      questions: [
        {
          id: 'dn-as-1',
          type: 'mcq',
          prompt: 'Which lifetime creates one instance per HTTP request?',
          choices: ['Transient', 'Scoped', 'Singleton', 'Request'],
          answer: 1,
          explain: 'Scoped is per scope, and ASP.NET Core creates one scope per request. `DbContext` is registered Scoped so all repositories in a request share the same unit of work and change tracker.',
        },
        {
          id: 'dn-as-2',
          type: 'mcq',
          prompt: 'You inject a Scoped `DbContext` into a Singleton service. What happens?',
          choices: [
            'It works fine',
            'A captive dependency: the context lives for the whole app, is used concurrently across requests, and throws or corrupts state - the container detects this in development',
            'The DbContext is silently recreated per call',
            'It is a compile error',
          ],
          answer: 1,
          explain: '`DbContext` is not thread-safe and its change tracker would accumulate every entity the app ever loads. The fix is to inject `IServiceScopeFactory` and create a scope per unit of work - the standard pattern in a `BackgroundService`.',
        },
        {
          id: 'dn-as-3',
          type: 'mcq',
          prompt: 'Which middleware ordering is correct?',
          choices: [
            '`UseAuthorization()` then `UseAuthentication()`',
            '`UseRouting()`, `UseAuthentication()`, `UseAuthorization()`, then endpoint mapping',
            '`MapControllers()` first so routes are known',
            'Order does not matter, the framework sorts it',
          ],
          answer: 1,
          explain: 'You must know *who* the caller is before you can decide whether they are allowed, and routing must have matched an endpoint before authorisation can read its `[Authorize]` metadata. Getting the order wrong silently allows anonymous access - a real security bug.',
        },
        {
          id: 'dn-as-4',
          type: 'mcq',
          prompt: 'In which order does configuration override, by default?',
          choices: [
            'appsettings.json wins over environment variables',
            'appsettings.json, then appsettings.{Environment}.json, then user secrets, then environment variables, then command line - later sources win',
            'Only appsettings.json is read',
            'Environment variables are ignored in production',
          ],
          answer: 1,
          explain: 'This layering is what lets one built artifact run in every environment. In containers you override `ConnectionStrings__Default` with a double underscore for nesting - a detail interviewers like to hear.',
        },
        {
          id: 'dn-as-5',
          type: 'mcq',
          prompt: 'What does `[ApiController]` add to a controller?',
          choices: [
            'Nothing, it is documentation',
            'Automatic 400 responses for invalid `ModelState`, inference of binding sources (body/route/query) and ProblemDetails error formatting',
            'It enables authentication',
            'It makes actions async',
          ],
          answer: 1,
          explain: 'It removes the `if (!ModelState.IsValid) return BadRequest(ModelState);` boilerplate and makes `[FromBody]` largely unnecessary for complex types. Errors come back as RFC 7807 ProblemDetails.',
        },
        {
          id: 'dn-as-6',
          type: 'multi',
          prompt: 'Which are reasonable Singleton registrations?',
          choices: [
            'A stateless clock/`IClock` abstraction',
            'An in-memory cache wrapper',
            '`DbContext`',
            'A configuration/options object read at startup',
            'A per-user shopping cart',
          ],
          answer: [0, 1, 3],
          explain: 'Singletons must be thread-safe and hold no per-request state. `DbContext` and anything per-user must be Scoped. If a singleton needs scoped work, it resolves a scope on demand via `IServiceScopeFactory`.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'dotnet-ef',
      name: 'EF Core and data access',
      tier: 3,
      minutes: 20,
      lesson: {
        summary:
          'EF Core is the default ORM. The questions are always the same: how migrations work, what change tracking costs, and how you avoid N+1 queries.',
        bullets: [
          '`DbContext` is a unit of work; `DbSet<T>` is a queryable set. `SaveChangesAsync()` writes all tracked changes in one transaction.',
          'Migrations: `dotnet ef migrations add Name` generates C# describing the schema delta; `dotnet ef database update` applies it. Commit migrations to source control.',
          '**Change tracking** lets you load, mutate and save. For read-only queries use `AsNoTracking()` - noticeably faster and less memory.',
          '**N+1**: loading a list then touching a navigation property per row issues one query per row. Fix with `Include`/`ThenInclude` (eager loading) or a projection.',
          'Project to a DTO with `Select` so you fetch only the columns you need - and avoid serialising your entity graph straight to the client.',
          'Filter, sort and page in the database (`Skip`/`Take`) before materialising.',
          'Lazy loading is off by default in EF Core, and that is a good default.',
          'Concurrency: a `rowversion`/`timestamp` column plus `DbUpdateConcurrencyException` handling implements optimistic concurrency.',
        ],
        code: {
          lang: 'csharp',
          src: `// N+1: one query for orders, then one per order for the customer
var orders = await db.Orders.ToListAsync(ct);
foreach (var o in orders) Console.WriteLine(o.Customer.Name);   // lazy/explicit load per row

// eager load - a single query with a join
var orders = await db.Orders
    .Include(o => o.Customer)
    .ThenInclude(c => c.Address)
    .AsNoTracking()
    .ToListAsync(ct);

// better still: project only what the API returns
var page = await db.Orders
    .Where(o => o.Status == OrderStatus.Open)
    .OrderByDescending(o => o.CreatedAt)
    .Skip((pageNo - 1) * size).Take(size)
    .Select(o => new OrderDto(o.Id, o.Customer.Name, o.Total))
    .AsNoTracking()
    .ToListAsync(ct);

// raw SQL stays parameterised
var users = await db.Users
    .FromSqlInterpolated($"SELECT * FROM Users WHERE Email = {email}")
    .ToListAsync(ct);`,
        },
        gotchas: [
          'Returning entities directly from a controller can serialise the whole object graph or throw on a reference cycle.',
          '`Include` on a large graph produces a cartesian explosion - use `AsSplitQuery()` or project instead.',
          'Calling `SaveChanges` inside a loop issues a round trip per iteration.',
        ],
        interview: [
          'What is the N+1 problem and how do you fix it?',
          'When would you use `AsNoTracking()`?',
          'How do migrations work and where do they live?',
        ],
      },
      questions: [
        {
          id: 'dn-ef-1',
          type: 'mcq',
          prompt: 'A page loading 100 orders issues 101 database queries. What is this and what fixes it?',
          choices: [
            'A connection leak - increase the pool size',
            'The N+1 problem - eager load with `Include`, or project the needed fields with `Select`',
            'Missing indexes - add one on the primary key',
            'Change tracking - call `SaveChanges` less often',
          ],
          answer: 1,
          explain: 'One query for the list, then one per row when a navigation property is touched. Every ORM has this failure mode (Hibernate, Sequelize, Prisma). Naming it and giving both fixes is a strong signal.',
        },
        {
          id: 'dn-ef-2',
          type: 'mcq',
          prompt: 'When should you add `AsNoTracking()`?',
          choices: [
            'Never, it disables the query',
            'On read-only queries - it skips building change-tracking snapshots, saving time and memory',
            'On every write',
            'Only inside transactions',
          ],
          answer: 1,
          explain: 'Tracking exists so `SaveChanges` knows what changed. For a GET endpoint that is pure overhead - EF creates and compares snapshots of every entity. You can also set `QueryTrackingBehavior.NoTracking` as the context default.',
        },
        {
          id: 'dn-ef-3',
          type: 'mcq',
          prompt: 'What does `dotnet ef migrations add AddUserEmail` do?',
          choices: [
            'Immediately alters the database',
            'Generates a C# migration describing the schema change; `dotnet ef database update` applies it',
            'Regenerates all entities from the database',
            'Creates a backup',
          ],
          answer: 1,
          explain: 'Migrations are code, reviewed and version-controlled alongside the model, and applied deliberately. In production most teams generate a SQL script (`dotnet ef migrations script --idempotent`) for the DBA or the deploy pipeline rather than migrating at app startup.',
        },
        {
          id: 'dn-ef-4',
          type: 'mcq',
          prompt: 'Why project to a DTO instead of returning EF entities from a controller?',
          choices: [
            'Entities cannot be serialised',
            'It controls exactly which fields are exposed and fetched, avoids leaking internal columns, and prevents reference-cycle and lazy-loading surprises',
            'DTOs are faster to allocate',
            'It is required by `[ApiController]`',
          ],
          answer: 1,
          explain: 'Returning entities couples your public API to your schema, and can leak `PasswordHash` or `IsDeleted` the moment someone adds a column. Projecting in the `Select` also means EF generates SQL for just those columns.',
        },
        {
          id: 'dn-ef-5',
          type: 'mcq',
          prompt: 'Two users edit the same record simultaneously. How does EF Core implement optimistic concurrency?',
          choices: [
            'It locks the row on read',
            'A `[Timestamp]`/`rowversion` column is included in the WHERE of the UPDATE; if zero rows are affected it throws `DbUpdateConcurrencyException`',
            'Last write always wins silently',
            'It retries automatically',
          ],
          answer: 1,
          explain: 'No locks are held between read and write, so throughput stays high; the conflict is detected at save time and your code decides - reload, merge, or tell the user. Pessimistic locking is the alternative and is rarely the right default for a web app.',
        },
        {
          id: 'dn-ef-6',
          type: 'tf',
          prompt: 'Lazy loading is enabled by default in EF Core.',
          answer: false,
          explain: 'It requires the proxies package and explicit configuration, and navigation properties must be `virtual`. The default is deliberate: implicit lazy loading is the main cause of accidental N+1 queries in EF6 codebases.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'dotnet-prod',
      name: 'Testing, logging and shipping',
      tier: 4,
      minutes: 16,
      lesson: {
        summary:
          'How a .NET service is verified and operated - the questions that come after "can you write an endpoint".',
        bullets: [
          'Test stack: **xUnit** (or NUnit/MSTest) with **Moq**/NSubstitute for fakes and **FluentAssertions** for readable asserts.',
          '`WebApplicationFactory<Program>` spins the whole app in-memory for integration tests - real routing, real DI, real middleware, no network.',
          'Test the service layer with unit tests and the endpoints with integration tests. Testcontainers gives you a real database in CI.',
          'Log through `ILogger<T>` with **structured** message templates: `LogInformation("Order {OrderId} shipped", id)` - never string interpolation, or you lose the searchable fields.',
          'Log levels: Trace < Debug < Information < Warning < Error < Critical. Production usually sits at Information.',
          'Expose health checks (`AddHealthChecks`, `MapHealthChecks("/health")`) so the orchestrator can restart or drain the instance.',
          'Observability: OpenTelemetry for traces and metrics, with a correlation/trace id flowing across services.',
          'Deploy: `dotnet publish -c Release` into a container, configuration from environment variables, secrets from the platform vault.',
        ],
        code: {
          lang: 'csharp',
          src: `public class UsersApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    public UsersApiTests(WebApplicationFactory<Program> factory) => _client = factory.CreateClient();

    [Fact]
    public async Task Get_unknown_user_returns_404()
    {
        var response = await _client.GetAsync("/api/users/" + Guid.NewGuid());
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}

// structured logging: OrderId stays a queryable field
_logger.LogInformation("Order {OrderId} shipped to {Country}", order.Id, country);

// NOT this - the values are baked into one opaque string
_logger.LogInformation($"Order {order.Id} shipped");`,
        },
        gotchas: [
          'Interpolated log messages destroy structured fields and defeat log search.',
          'A health check that only returns 200 without checking dependencies is theatre.',
          'Unit-testing a controller by mocking six services usually means the logic belongs in a service.',
        ],
        interview: [
          'How do you test an ASP.NET Core API?',
          'What is structured logging and why does it matter?',
          'What do you expose for a container orchestrator to monitor?',
        ],
      },
      questions: [
        {
          id: 'dn-pr-1',
          type: 'mcq',
          prompt: 'What does `WebApplicationFactory<Program>` give you?',
          choices: [
            'A mock of your controllers',
            'The real application hosted in-memory, so tests exercise routing, middleware, DI and serialisation over a fake HttpClient',
            'A load testing harness',
            'A code generator for tests',
          ],
          answer: 1,
          explain: 'It is the officially supported integration-testing entry point. Tests catch the things unit tests cannot: a wrong route template, a missing DI registration, broken JSON casing, misordered middleware. Services are commonly swapped for test doubles via `WithWebHostBuilder`.',
        },
        {
          id: 'dn-pr-2',
          type: 'mcq',
          prompt: 'Why is `LogInformation("User {UserId} logged in", id)` better than `LogInformation($"User {id} logged in")`?',
          choices: [
            'It is shorter',
            'The template plus named values are preserved, so log platforms can index and filter on UserId; interpolation flattens it into one string',
            'Interpolation does not compile',
            'It avoids boxing',
          ],
          answer: 1,
          explain: 'With structured logging you can query `UserId = 42` across millions of lines. It also avoids formatting cost when the level is disabled. Analyzer CA2254 flags the interpolated form.',
        },
        {
          id: 'dn-pr-3',
          type: 'mcq',
          prompt: 'Which is a genuinely useful readiness health check?',
          choices: [
            'Return 200 unconditionally',
            'Verify the database connection and any critical downstream dependency, then report Healthy/Degraded/Unhealthy',
            'Check that the process is running',
            'Ping the load balancer',
          ],
          answer: 1,
          explain: 'Distinguish **liveness** (is the process wedged - restart it) from **readiness** (can it serve traffic - route around it). A readiness probe that ignores the database keeps sending traffic to an instance that cannot answer anything.',
        },
        {
          id: 'dn-pr-4',
          type: 'multi',
          prompt: 'Which belong in a deployable .NET service?',
          choices: [
            'Configuration from environment variables',
            'A Release build (`dotnet publish -c Release`)',
            'Health check endpoints',
            'Connection strings committed in appsettings.json',
            'Structured logs written to stdout',
          ],
          answer: [0, 1, 2, 4],
          explain: 'Committed connection strings are a credential leak the moment the repo is cloned or forked. Writing logs to stdout (rather than files) is the container-native convention - the platform collects them.',
        },
        {
          id: 'dn-pr-5',
          type: 'flash',
          prompt: 'Describe how you would test a `POST /api/orders` endpoint properly.',
          answer: 'Two layers. Unit tests on the service that owns the rules - order total calculation, stock validation, what happens when the customer is unknown - with the repository and any clock or payment gateway faked via their interfaces, asserting both the happy path and each failure branch. Then integration tests through WebApplicationFactory<Program> that POST real JSON and assert the status code (201 with a Location header), the response body shape, and that a 400 with ProblemDetails comes back for an invalid payload. Point the test host at a real database via Testcontainers or a per-test SQLite/scoped transaction so EF mapping and migrations are genuinely exercised, and reset state between tests. I would not mock the DbContext - in-memory providers behave differently from SQL and hide real query failures.',
          explain: 'Signals: separating unit from integration, naming WebApplicationFactory and Testcontainers, testing failure paths, and refusing to mock DbContext.',
        },
      ],
    },
  ],
};
