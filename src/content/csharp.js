export default {
  id: 'csharp',
  name: 'C#',
  mark: 'C#',
  color: '#a179dc',
  blurb: 'The language side of the .NET stack: value vs reference types, OOP, LINQ, async/await and the null-safety features.',
  modules: [
    /* ------------------------------------------------------------------ */
    {
      id: 'cs-types',
      name: 'Types, value vs reference, null',
      tier: 2,
      minutes: 16,
      lesson: {
        summary:
          'C# is statically typed and compiled to IL, which the CLR JIT-compiles at runtime. The value-vs-reference distinction underpins half of all C# interview questions.',
        bullets: [
          '**Value types** (`int`, `double`, `bool`, `DateTime`, `struct`, `enum`) hold their data directly and copy on assignment.',
          '**Reference types** (`class`, `string`, arrays, `record` by default, delegates) hold a reference; assignment copies the reference, not the object.',
          '`string` is a reference type but **immutable**, and `==` is overloaded to compare contents - so it behaves like a value type in practice.',
          'Building a string in a loop with `+=` allocates a new string each time. Use `StringBuilder`.',
          'Nullable value types: `int?` is `Nullable<int>`. Nullable **reference** types are a compile-time analysis enabled by `<Nullable>enable</Nullable>` - `string?` vs `string`.',
          '`var` is still static typing - the compiler infers the type. It is not `dynamic`.',
          '`const` is compile-time and baked into callers; `readonly` is set once at construction and can differ per instance.',
        ],
        code: {
          lang: 'csharp',
          src: `int a = 5;
int b = a;      b = 10;      // a is still 5 (copy)

var list1 = new List<int> { 1 };
var list2 = list1;  list2.Add(2);   // list1.Count == 2 (same object)

string s = "hello";
s.ToUpper();                 // returns a NEW string; s is unchanged
s = s.ToUpper();             // this is how you "modify" it

// nullable reference types
#nullable enable
string  required = null;     // warning
string? optional = null;     // fine
int len = optional?.Length ?? 0;

// modern null handling
ArgumentNullException.ThrowIfNull(user);
name ??= "anonymous";`,
        },
        gotchas: [
          '`==` on two `object` references compares references; on `string` it compares text; on a custom class it compares references unless you overload it.',
          'Mutable structs behave surprisingly - modifying one retrieved from a list changes only a copy.',
          'Nullable reference types produce warnings, not errors, and disappear at runtime.',
        ],
        interview: [
          'Value type vs reference type - with an example.',
          'Is `string` a value type? Why does it feel like one?',
          '`const` vs `readonly`?',
        ],
      },
      questions: [
        {
          id: 'cs-t-1',
          type: 'mcq',
          prompt: 'Which is a **value** type?',
          choices: ['`string`', '`DateTime`', '`object`', '`int[]`'],
          answer: 1,
          explain: '`DateTime` is a struct, so it copies on assignment. `string`, `object` and all arrays are reference types. The usual follow-up: `decimal`, `Guid` and `TimeSpan` are also structs.',
        },
        {
          id: 'cs-t-2',
          type: 'mcq',
          prompt: 'What is `s` after this runs?',
          code: `string s = "hello";
s.ToUpper();`,
          lang: 'csharp',
          choices: ['"HELLO"', '"hello"', '`null`', 'It does not compile'],
          answer: 1,
          explain: 'Strings are immutable: every "mutating" method returns a new string and the original is untouched. You must assign the result. This is a classic screening question and also the reason `+=` in a loop is O(n^2) - use `StringBuilder`.',
        },
        {
          id: 'cs-t-3',
          type: 'mcq',
          prompt: 'Given `<Nullable>enable</Nullable>`, what does `string? name` mean?',
          choices: [
            'The variable is boxed',
            'It may be null, and the compiler warns about dereferencing it without a check',
            'It is a value type wrapper like `Nullable<string>`',
            'It throws if assigned null',
          ],
          answer: 1,
          explain: 'Nullable reference types are pure static analysis - metadata and warnings, erased at runtime, unlike `int?` which is a real `Nullable<int>` struct. That is why you still validate inputs at public boundaries.',
        },
        {
          id: 'cs-t-4',
          type: 'mcq',
          prompt: '`const` vs `readonly` - which is true?',
          choices: [
            'They are identical',
            '`const` is compile-time, implicitly static, and inlined into calling assemblies; `readonly` is set at runtime in the constructor and can vary per instance',
            '`readonly` fields can be reassigned anywhere in the class',
            '`const` can hold any type',
          ],
          answer: 1,
          explain: 'The inlining detail matters in practice: change a public `const` in a library and consumers keep the old value until they recompile. `const` is also limited to compile-time constants (primitives, string, enum, null).',
        },
        {
          id: 'cs-t-5',
          type: 'mcq',
          prompt: 'What does `var` do?',
          choices: [
            'Makes the variable dynamically typed like JavaScript',
            'Lets the compiler infer a single static type from the initialiser',
            'Boxes the value',
            'Defers type resolution to runtime',
          ],
          answer: 1,
          explain: '`var x = 5` is exactly `int x = 5` after compilation - identical IL. `dynamic` is the one that defers to runtime and skips compile-time checking.',
        },
        {
          id: 'cs-t-6',
          type: 'short',
          prompt: 'Which class should you use to build a string inside a large loop?',
          answer: ['StringBuilder', 'System.Text.StringBuilder'],
          explain: 'Each `+=` on a string allocates a whole new string and copies the old contents, so a 10,000-iteration loop does ~50 million character copies and produces 10,000 garbage objects. `StringBuilder` keeps a growable buffer.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'cs-oop',
      name: 'Classes, interfaces and modern C#',
      tier: 3,
      minutes: 18,
      lesson: {
        summary:
          'The OOP vocabulary interviewers use, plus the newer features (records, pattern matching, primary constructors) that show you have written C# recently.',
        bullets: [
          '**Interface**: a contract with no state and (usually) no implementation. A class can implement many. **Abstract class**: a partial base with fields, constructors and shared logic; a class inherits exactly one.',
          'Rule of thumb: interface = "can do" (`IDisposable`, `IComparable`); abstract class = "is a" with shared code.',
          '`virtual` marks a method as overridable; `override` replaces it; `new` **hides** it (usually a mistake); `sealed` stops further overriding.',
          '`record` gives you value-based equality, `ToString`, deconstruction and `with` expressions - ideal for DTOs. `record struct` for value semantics.',
          'Pattern matching: `is`, switch expressions, property and relational patterns - the modern replacement for long if/else chains.',
          '`required` members must be set at initialisation; primary constructors (C# 12) cut boilerplate.',
          'Prefer **composition/dependency injection** over deep inheritance - which is exactly how ASP.NET Core is designed.',
        ],
        code: {
          lang: 'csharp',
          src: `public interface IUserRepository
{
    Task<User?> FindAsync(Guid id, CancellationToken ct = default);
}

// record: value equality + immutability, perfect for DTOs
public record UserDto(Guid Id, string Name, string Email);

var a = new UserDto(id, "Ada", "ada@x.com");
var b = a with { Name = "Grace" };     // non-destructive copy
a == new UserDto(id, "Ada", "ada@x.com");   // true - value equality

// primary constructor (C# 12) + DI
public class UserService(IUserRepository repo, ILogger<UserService> logger)
{
    public Task<User?> GetAsync(Guid id) => repo.FindAsync(id);
}

// pattern matching
string Describe(object o) => o switch
{
    null                        => "nothing",
    int n when n < 0            => "negative",
    int n                       => $"int {n}",
    User { IsAdmin: true } u    => $"admin {u.Name}",
    string s                    => s.ToUpper(),
    _                           => "unknown"
};`,
        },
        gotchas: [
          'Two `class` instances with identical data are not equal by default; two `record` instances are.',
          '`record` gives *shallow* value equality - a list property still compares by reference.',
          'Hiding with `new` instead of `override` means the base implementation runs when called through a base reference.',
        ],
        interview: [
          'Interface vs abstract class - when do you pick each?',
          'What does `record` give you over `class`?',
          '`virtual`/`override`/`new`/`abstract` - explain each.',
        ],
      },
      questions: [
        {
          id: 'cs-o-1',
          type: 'mcq',
          prompt: 'When would you choose an abstract class over an interface?',
          choices: [
            'When you need multiple inheritance',
            'When related types share state and implementation you do not want to duplicate',
            'Whenever the type has methods',
            'Interfaces are legacy',
          ],
          answer: 1,
          explain: 'Abstract classes can hold fields, constructors and concrete helpers; a class can inherit only one. Interfaces are contracts that anything can satisfy, which is what makes dependency injection and unit-test mocking work. Since C# 8 interfaces may carry default implementations, but they still hold no instance state.',
        },
        {
          id: 'cs-o-2',
          type: 'mcq',
          prompt: 'What does `record` primarily give you over `class`?',
          choices: [
            'Faster allocation',
            'Value-based equality, a generated `ToString`, deconstruction and `with` expressions',
            'Automatic thread safety',
            'Implicit serialisation',
          ],
          answer: 1,
          explain: 'Two records with equal member values are `==`. That makes them a natural fit for DTOs, API contracts and value objects, and it makes tests read well. A `record` is still a reference type unless you write `record struct`.',
        },
        {
          id: 'cs-o-3',
          type: 'mcq',
          prompt: 'Base declares `virtual void Save()`. Derived declares `new void Save()`. You call `Save()` through a variable typed as the base. Which runs?',
          choices: ['The derived one', 'The base one', 'Both', 'It does not compile'],
          answer: 1,
          explain: '`new` hides rather than overrides, so dispatch is decided by the *declared* type of the variable, not the runtime type. `override` would give you polymorphic dispatch to the derived method. This is a favourite trick question.',
        },
        {
          id: 'cs-o-4',
          type: 'mcq',
          prompt: 'Why do ASP.NET Core services take interfaces in their constructors?',
          choices: [
            'Interfaces are faster',
            'Dependency inversion: the class depends on a contract, so the container can supply a real implementation in production and a fake in tests',
            'It is required by the compiler',
            'To enable multiple inheritance',
          ],
          answer: 1,
          explain: 'Constructor injection against an abstraction is the D in SOLID and the whole reason the built-in container exists. It also makes the dependencies of a class explicit and impossible to forget.',
        },
        {
          id: 'cs-o-5',
          type: 'mcq',
          prompt: 'What does `var updated = original with { Status = "closed" };` do?',
          choices: [
            'Mutates `original`',
            'Creates a copy of the record with one property changed, leaving the original untouched',
            'Casts the record',
            'Only compiles for structs',
          ],
          answer: 1,
          explain: 'A non-destructive mutation - the same idea as JavaScript\'s `{ ...obj, status }`. It keeps immutable records practical to work with.',
        },
        {
          id: 'cs-o-6',
          type: 'multi',
          prompt: 'Which are true of interfaces in modern C#?',
          choices: [
            'A class can implement many of them',
            'They can declare default method implementations (C# 8+)',
            'They can hold instance fields',
            'They can be used as a type for a constructor parameter',
          ],
          answer: [0, 1, 3],
          explain: 'Instance state is the line interfaces still do not cross - default implementations may exist, but there are no instance fields, so an interface can never carry per-object data. That remains the key distinction from an abstract class.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'cs-linq',
      name: 'Collections and LINQ',
      tier: 3,
      minutes: 16,
      lesson: {
        summary:
          'LINQ is the C# answer to `map`/`filter`/`reduce`, and it is everywhere in .NET code. The deferred-execution question comes up constantly.',
        bullets: [
          'Pick the right collection: `List<T>` for ordered items, `Dictionary<K,V>` for O(1) lookup, `HashSet<T>` for uniqueness and set operations, `Queue`/`Stack` for order semantics.',
          '`IEnumerable<T>` is lazy and forward-only; `List<T>`/`Array` are materialised; `IQueryable<T>` builds an expression tree that a provider (EF Core) translates into SQL.',
          '**Deferred execution**: `Where`/`Select` build a pipeline; nothing runs until you enumerate with `ToList()`, `foreach`, `Count()`, `First()`, etc.',
          'Multiple enumeration re-runs the whole query - and against a database, re-queries it. Materialise once with `ToList()`.',
          '`First` throws when empty; `FirstOrDefault` returns `null`/default. `Single` throws if there is more than one.',
          '`Any()` is the idiomatic emptiness check, not `Count() > 0`.',
          'On `IQueryable`, filter before you materialise: `.Where(...).ToList()` filters in SQL, `.ToList().Where(...)` downloads the whole table first.',
        ],
        code: {
          lang: 'csharp',
          src: `var activeNames = users
    .Where(u => u.IsActive)
    .OrderByDescending(u => u.Score)
    .Select(u => u.Name)
    .Take(10)
    .ToList();                 // <- executes here

var byId    = users.ToDictionary(u => u.Id);
var total   = orders.Sum(o => o.Amount);
var perUser = orders.GroupBy(o => o.UserId)
                    .Select(g => new { UserId = g.Key, Total = g.Sum(o => o.Amount) });

if (users.Any(u => u.IsAdmin)) { }          // not Count() > 0

// deferred execution trap
var query = db.Users.Where(u => u.IsActive);  // no SQL yet
var count = query.Count();                    // SELECT COUNT(*)
var list  = query.ToList();                   // second round trip!`,
        },
        gotchas: [
          '`ToList()` inside a loop hits the database every iteration.',
          '`Select` after `ToList()` runs in memory - fine for 10 rows, fatal for a million.',
          '`OrderBy` on a nullable column and `null` ordering differ between LINQ-to-Objects and SQL.',
        ],
        interview: [
          'What is deferred execution?',
          '`IEnumerable` vs `IQueryable`?',
          '`First` vs `FirstOrDefault` vs `Single`?',
        ],
      },
      questions: [
        {
          id: 'cs-l-1',
          type: 'mcq',
          prompt: 'When does the database actually get queried?',
          code: `var query = db.Users.Where(u => u.IsActive);
Console.WriteLine("built");
var users = query.ToList();`,
          lang: 'csharp',
          choices: [
            'At the `Where` call',
            'At `ToList()`',
            'At the `Console.WriteLine`',
            'When the DbContext is disposed',
          ],
          answer: 1,
          explain: 'Deferred execution: `Where` only builds an expression tree. `ToList()`, `foreach`, `Count()`, `First()` and friends are the terminal operations that send SQL. Enumerating twice sends two queries.',
        },
        {
          id: 'cs-l-2',
          type: 'mcq',
          prompt: 'What is the practical difference between `IEnumerable<T>` and `IQueryable<T>` on a DbSet?',
          choices: [
            'None',
            '`IQueryable` translates the expression into SQL for the server; once you cast to `IEnumerable`, remaining operators run in memory on the client',
            '`IEnumerable` is always faster',
            '`IQueryable` is read-only',
          ],
          answer: 1,
          explain: 'A common production incident: someone adds `.AsEnumerable()` or `.ToList()` too early and a `Where` that used to be a SQL predicate starts pulling the whole table into memory. Filter, sort and page *before* materialising.',
        },
        {
          id: 'cs-l-3',
          type: 'mcq',
          prompt: 'The collection may be empty and you want `null` rather than an exception. Which do you call?',
          choices: ['`First()`', '`FirstOrDefault()`', '`Single()`', '`Take(1)`'],
          answer: 1,
          explain: '`First` throws `InvalidOperationException` on an empty sequence. `Single` throws if there is zero *or more than one* - use it when "more than one" is a bug worth crashing over, such as a lookup by primary key.',
        },
        {
          id: 'cs-l-4',
          type: 'mcq',
          prompt: 'You need to check membership of a 50,000-item list thousands of times. Which type?',
          choices: ['`List<T>` with `Contains`', '`HashSet<T>`', '`Array` with `IndexOf`', '`Queue<T>`'],
          answer: 1,
          explain: '`List.Contains` is a linear scan, O(n). `HashSet<T>.Contains` is O(1) average. Same reasoning as building a `Map` index in JavaScript - and a very common "how would you optimise this" answer.',
        },
        {
          id: 'cs-l-5',
          type: 'mcq',
          prompt: 'Why prefer `users.Any(u => u.IsActive)` over `users.Count(u => u.IsActive) > 0`?',
          choices: [
            'It reads better only',
            '`Any` short-circuits on the first match, while `Count` walks the whole sequence (or issues a COUNT query)',
            '`Count` does not compile on IEnumerable',
            'They are identical after JIT',
          ],
          answer: 1,
          explain: 'Over a large in-memory sequence or a database table the difference is real. `Any()` also expresses intent - a reviewer sees "does one exist" rather than "how many".',
        },
        {
          id: 'cs-l-6',
          type: 'short',
          prompt: 'Which LINQ method turns a list of objects into a keyed lookup dictionary?',
          answer: ['ToDictionary', 'ToDictionary()'],
          explain: '`users.ToDictionary(u => u.Id)` gives `Dictionary<Guid, User>`; a second lambda selects the value. It throws on duplicate keys - use `ToLookup` when keys can repeat, which yields groups instead.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'cs-async',
      name: 'async/await, exceptions and disposal',
      tier: 4,
      minutes: 18,
      lesson: {
        summary:
          'Async in C# looks like JavaScript but sits on a thread pool, which changes the failure modes. Plus the two other things every C# reviewer checks: exception handling and `IDisposable`.',
        bullets: [
          '`async`/`await` frees the thread while waiting on I/O, so the server handles more concurrent requests. It is not about making one request faster.',
          '`Task<T>` is a future value; `await` unwraps it and rethrows any exception.',
          'Async all the way down. `.Result` and `.Wait()` block a pool thread and can **deadlock** in contexts with a synchronisation context.',
          '`async void` is only for event handlers - its exceptions cannot be caught and will crash the process. Use `async Task`.',
          'Accept a `CancellationToken` and pass it down; ASP.NET Core supplies one that fires when the client disconnects.',
          'Catch specific exceptions. `catch (Exception ex) { throw ex; }` resets the stack trace - use bare `throw;`.',
          '`using`/`await using` guarantees `Dispose`/`DisposeAsync` even on exception. `HttpClient` is the exception to the rule: reuse one (or `IHttpClientFactory`), do not `using` it per call.',
          '`finally` always runs; that is where cleanup that must not be skipped belongs.',
        ],
        code: {
          lang: 'csharp',
          src: `public async Task<User?> GetAsync(Guid id, CancellationToken ct)
{
    await using var conn = new SqlConnection(_cs);
    return await conn.QuerySingleOrDefaultAsync<User>(sql, new { id }, ct);
}

// run independent calls concurrently
var userTask  = GetUserAsync(id, ct);
var orderTask = GetOrdersAsync(id, ct);
await Task.WhenAll(userTask, orderTask);
var user = await userTask;

// preserve the stack trace
try { await DoWorkAsync(ct); }
catch (SqlException ex)
{
    _logger.LogError(ex, "Query failed for {UserId}", id);
    throw;                    // NOT "throw ex;"
}

// deadlock risk - never do this
var bad = GetAsync(id, ct).Result;`,
        },
        gotchas: [
          '`.Result` on a task in a legacy ASP.NET or WPF context deadlocks the request thread.',
          'An `async void` method\'s exception bypasses your try/catch entirely.',
          'Sequential `await`s for independent calls double your latency - use `Task.WhenAll`.',
        ],
        interview: [
          'What does `await` actually do to the thread?',
          'Why is `async void` dangerous?',
          '`throw` vs `throw ex`?',
        ],
      },
      questions: [
        {
          id: 'cs-a-1',
          type: 'mcq',
          prompt: 'What is the main benefit of `async`/`await` in an ASP.NET Core API?',
          choices: [
            'Individual requests complete faster',
            'The thread is released while waiting on I/O, so a fixed thread pool serves far more concurrent requests',
            'It parallelises CPU work across cores',
            'It removes the need for a database connection pool',
          ],
          answer: 1,
          explain: 'Throughput, not latency. A synchronous handler holds a thread pool thread for the whole database round trip; under load the pool starves and requests queue. Async returns the thread to the pool during the wait.',
        },
        {
          id: 'cs-a-2',
          type: 'mcq',
          prompt: 'Why is `async void` dangerous?',
          choices: [
            'It is slower',
            'The caller cannot await it and exceptions escape to the runtime instead of your try/catch, typically crashing the process',
            'It cannot use `await` inside',
            'It always deadlocks',
          ],
          answer: 1,
          explain: 'With `async Task` the exception is captured on the task and surfaces at the `await`. With `async void` there is no task to hold it, so it is raised on the synchronisation context. The only legitimate use is a UI event handler whose signature is fixed.',
        },
        {
          id: 'cs-a-3',
          type: 'mcq',
          prompt: 'What is wrong with `var user = GetUserAsync(id).Result;`?',
          choices: [
            'Nothing, it is a shortcut',
            'It blocks a thread pool thread and can deadlock; it also wraps exceptions in `AggregateException`',
            '`.Result` does not exist on Task<T>',
            'It skips the database call',
          ],
          answer: 1,
          explain: 'Sync-over-async is the classic .NET performance bug: under load, blocked threads starve the pool and throughput collapses. In contexts with a synchronisation context (classic ASP.NET, WPF) it deadlocks outright. Go async all the way down.',
        },
        {
          id: 'cs-a-4',
          type: 'mcq',
          prompt: 'Difference between `throw;` and `throw ex;` inside a catch block?',
          choices: [
            'None',
            '`throw;` rethrows preserving the original stack trace; `throw ex;` resets it to this line',
            '`throw ex;` is faster',
            '`throw;` only works for custom exceptions',
          ],
          answer: 1,
          explain: 'Losing the original stack trace hides where the failure actually came from, which turns a 5-minute diagnosis into an afternoon. Use bare `throw;`, or wrap with `throw new AppException("...", ex)` to keep the inner exception.',
        },
        {
          id: 'cs-a-5',
          type: 'mcq',
          prompt: 'You need a user and their orders from two independent async calls. Fastest correct pattern?',
          choices: [
            '`var u = await GetUser(); var o = await GetOrders();`',
            'Start both tasks, then `await Task.WhenAll(userTask, orderTask)`',
            'Use `.Result` on both',
            'Run them in `Parallel.For`',
          ],
          answer: 1,
          explain: 'Sequential awaits add the latencies together. Starting both first puts them in flight concurrently - the C# equivalent of `Promise.all`. `Parallel.For` is for CPU-bound work, not I/O.',
        },
        {
          id: 'cs-a-6',
          type: 'mcq',
          prompt: 'Which is true about `HttpClient`?',
          choices: [
            'Wrap every call in `using` to release the socket promptly',
            'Reuse a single instance or use `IHttpClientFactory` - disposing per call exhausts sockets via TIME_WAIT',
            'It must be created per thread',
            'It is not thread-safe',
          ],
          answer: 1,
          explain: 'The famous exception to the `using` rule. Disposing does not immediately free the underlying socket, so a per-call `using` under load causes socket exhaustion. `IHttpClientFactory` also handles DNS rotation and lets you attach Polly retry policies.',
        },
        {
          id: 'cs-a-7',
          type: 'flash',
          prompt: 'What is `IDisposable` for, and how does `using` relate to it?',
          answer: 'IDisposable is the contract for releasing unmanaged or scarce resources deterministically - file handles, sockets, database connections - because the garbage collector only manages memory and runs at an unpredictable time. `using var conn = new SqlConnection(...)` compiles to a try/finally that calls Dispose() when the scope exits, including on an exception or early return, so the connection returns to the pool no matter what. `IAsyncDisposable` plus `await using` is the async version, used for things that need to flush or send a close frame. If a class holds a disposable field, it should itself implement IDisposable and dispose that field.',
          explain: 'Key phrases: deterministic cleanup, try/finally, GC only handles memory, connection returns to the pool.',
        },
      ],
    },
  ],
};
