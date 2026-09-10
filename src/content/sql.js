export default {
  id: 'sql',
  name: 'SQL & Data',
  mark: 'DB',
  color: '#f29111',
  blurb: 'Joins, keys, indexes and transactions. Every CRUD job has a database behind it and every interview asks about it.',
  modules: [
    /* ------------------------------------------------------------------ */
    {
      id: 'sql-query',
      name: 'Querying: joins and grouping',
      tier: 2,
      minutes: 16,
      lesson: {
        summary:
          'SQL is declarative - you describe the result, the engine picks the plan. Getting joins and the difference between WHERE and HAVING right covers most day-one questions.',
        bullets: [
          'Logical order of evaluation: `FROM` -> `JOIN` -> `WHERE` -> `GROUP BY` -> `HAVING` -> `SELECT` -> `ORDER BY` -> `LIMIT`. This is why you cannot use a `SELECT` alias in `WHERE`.',
          '`INNER JOIN` keeps only matching rows. `LEFT JOIN` keeps every row from the left table, filling unmatched right columns with `NULL`.',
          '`WHERE` filters rows **before** grouping; `HAVING` filters groups **after** aggregation.',
          'Aggregates: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`. Every non-aggregated selected column must appear in `GROUP BY`.',
          '`COUNT(*)` counts rows; `COUNT(column)` skips NULLs. `NULL` is unknown - comparisons with it are never true, so use `IS NULL`.',
          'A common bug: putting a condition on the right table of a `LEFT JOIN` in `WHERE` silently turns it into an inner join. Put it in the `ON` clause instead.',
        ],
        code: {
          lang: 'sql',
          src: `-- customers and how much they have spent, including those who never ordered
SELECT  c.id,
        c.name,
        COUNT(o.id)               AS order_count,
        COALESCE(SUM(o.total), 0) AS lifetime_value
FROM    customers c
LEFT JOIN orders o
       ON o.customer_id = c.id
      AND o.status = 'paid'      -- in ON, not WHERE, or the LEFT JOIN collapses
WHERE   c.created_at >= '2024-01-01'
GROUP BY c.id, c.name
HAVING  COUNT(o.id) > 3
ORDER BY lifetime_value DESC
LIMIT 20;`,
        },
        gotchas: [
          '`WHERE o.status = "paid"` after a LEFT JOIN removes the unmatched rows you were trying to keep.',
          '`NULL = NULL` is not true; it is unknown.',
          '`SELECT *` in production code breaks the moment someone adds a column.',
        ],
        interview: [
          'INNER vs LEFT JOIN?',
          'WHERE vs HAVING?',
          'Find customers with no orders - write the query.',
        ],
      },
      questions: [
        {
          id: 'sql-q-1',
          type: 'mcq',
          prompt: 'You need every customer plus their orders, including customers who have never ordered. Which join?',
          choices: ['`INNER JOIN`', '`LEFT JOIN` from customers to orders', '`CROSS JOIN`', '`RIGHT JOIN` from customers'],
          answer: 1,
          explain: 'LEFT keeps all rows from the left (customers) and fills missing order columns with NULL. To find customers with *no* orders, add `WHERE o.id IS NULL` - the classic "anti-join" interview question.',
        },
        {
          id: 'sql-q-2',
          type: 'mcq',
          prompt: 'What is the difference between `WHERE` and `HAVING`?',
          choices: [
            'They are interchangeable',
            '`WHERE` filters individual rows before grouping; `HAVING` filters the grouped results, so it can reference aggregates',
            '`HAVING` is only for joins',
            '`WHERE` cannot be used with `GROUP BY`',
          ],
          answer: 1,
          explain: '`WHERE COUNT(*) > 3` is an error because counts do not exist yet at that stage. Filter as early as possible - a `WHERE` reduces the rows the grouping has to process.',
        },
        {
          id: 'sql-q-3',
          type: 'mcq',
          prompt: 'Table has 10 rows; 3 have `email = NULL`. What do `COUNT(*)` and `COUNT(email)` return?',
          choices: ['10 and 10', '10 and 7', '7 and 7', '10 and 3'],
          answer: 1,
          explain: '`COUNT(*)` counts rows regardless of content; `COUNT(column)` counts non-NULL values. The same NULL logic breaks naive filters: `WHERE email != "x"` also excludes NULL emails, which surprises people.',
        },
        {
          id: 'sql-q-4',
          type: 'mcq',
          prompt: 'Why can you not reference a `SELECT` alias inside `WHERE`?',
          choices: [
            'It is a syntax quirk with no reason',
            '`WHERE` is evaluated before `SELECT` in the logical processing order, so the alias does not exist yet',
            'Aliases are only for display',
            'You can, in every database',
          ],
          answer: 1,
          explain: 'The logical order is FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY. `ORDER BY` comes after `SELECT`, which is why aliases *do* work there. Some engines (MySQL) relax this, but the portable answer is the ordering.',
        },
        {
          id: 'sql-q-5',
          type: 'short',
          prompt: 'Which function replaces a NULL with a fallback value in standard SQL?',
          answer: ['COALESCE', 'coalesce()'],
          explain: '`COALESCE(sum(o.total), 0)` returns the first non-NULL argument and takes any number of them. `ISNULL` (SQL Server) and `IFNULL` (MySQL) are the two-argument vendor-specific versions.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'sql-model',
      name: 'Keys, relationships and transactions',
      tier: 3,
      minutes: 16,
      lesson: {
        summary:
          'Schema design and transactional integrity - the "do you understand data, not just queries" half of the interview.',
        bullets: [
          '**Primary key** uniquely identifies a row. **Foreign key** references another table\'s key and lets the database enforce referential integrity.',
          'One-to-many: the foreign key lives on the "many" side. Many-to-many needs a **join/junction table** holding both keys.',
          'Normalisation removes duplicated data (3NF is the usual target). Deliberate denormalisation trades write complexity for read speed - say that you would measure first.',
          '**ACID**: Atomicity (all or nothing), Consistency (constraints hold), Isolation (concurrent transactions do not corrupt each other), Durability (committed means committed).',
          'A transaction wraps several statements so they commit or roll back together - a transfer that debits one account must credit the other.',
          'Isolation levels trade correctness for concurrency: Read Committed (common default) allows non-repeatable reads; Serializable prevents anomalies at the cost of contention.',
          'Prefer soft deletes (`deleted_at`) when you need history or audit; hard deletes when you legally must remove data.',
        ],
        code: {
          lang: 'sql',
          src: `CREATE TABLE orders (
  id           uuid PRIMARY KEY,
  customer_id  uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  status       text NOT NULL CHECK (status IN ('pending','paid','shipped')),
  total_cents  integer NOT NULL CHECK (total_cents >= 0),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_items (            -- many-to-many via a junction table
  order_id   uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity   integer NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (order_id, product_id)
);

BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;   -- both or neither`,
        },
        gotchas: [
          'Storing money as `float` loses cents. Use `decimal`/`numeric` or integer minor units.',
          'No foreign key means orphan rows appear the first time a delete goes wrong.',
          'Long transactions hold locks and block everyone else - keep them short.',
        ],
        interview: [
          'What does ACID stand for?',
          'How do you model many-to-many?',
          'When would you denormalise?',
        ],
      },
      questions: [
        {
          id: 'sql-m-1',
          type: 'mcq',
          prompt: 'How do you model "a student takes many courses, a course has many students"?',
          choices: [
            'A foreign key on students pointing at courses',
            'A junction table `student_courses(student_id, course_id)` with a composite primary key',
            'A comma-separated list of course ids in a column',
            'Duplicate the course row per student',
          ],
          answer: 1,
          explain: 'A junction table is the only shape that supports both directions, allows attributes on the relationship (enrolled_at, grade), and keeps foreign keys enforceable. Comma-separated ids are unqueryable and unindexable - a classic anti-pattern.',
        },
        {
          id: 'sql-m-2',
          type: 'mcq',
          prompt: 'What does the "I" in ACID guarantee?',
          choices: [
            'Every table is indexed',
            'Concurrent transactions do not see each other\'s uncommitted intermediate state',
            'The database is on isolated hardware',
            'Integrity constraints are checked',
          ],
          answer: 1,
          explain: 'Isolation. How strictly it holds depends on the isolation level - Read Committed (the usual default) still permits non-repeatable reads and phantoms, which is exactly the trade-off interviewers want you to know about.',
        },
        {
          id: 'sql-m-3',
          type: 'mcq',
          prompt: 'Which column type should hold a monetary amount?',
          choices: ['`float`', '`decimal`/`numeric`, or an integer number of cents', '`double precision`', '`text`'],
          answer: 1,
          explain: 'Binary floating point cannot represent 0.10 exactly, so sums drift. `decimal(19,4)` stores exact base-10 values; integer cents is the other standard answer. Same reasoning as the JavaScript `0.1 + 0.2` question - and mapping to C#\'s `decimal`.',
        },
        {
          id: 'sql-m-4',
          type: 'mcq',
          prompt: 'Why wrap a debit and a credit in one transaction?',
          choices: [
            'Speed',
            'Atomicity - a crash between the two statements must not leave money destroyed or created',
            'To avoid locks',
            'It is required by the ORM',
          ],
          answer: 1,
          explain: 'All-or-nothing. Without it, a failure after the debit permanently loses money. In EF Core a single `SaveChangesAsync` is already one transaction; spanning multiple calls needs an explicit `BeginTransactionAsync`.',
        },
        {
          id: 'sql-m-5',
          type: 'tf',
          prompt: 'A foreign key constraint can prevent deleting a row that other rows still reference.',
          answer: true,
          explain: '`ON DELETE RESTRICT`/`NO ACTION` blocks the delete; `CASCADE` deletes the children; `SET NULL` orphans them deliberately. Choosing per relationship is a schema-design decision, and cascade deletes on a large tree can be surprisingly expensive.',
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'sql-perf',
      name: 'Indexes and query performance',
      tier: 4,
      minutes: 14,
      lesson: {
        summary:
          '"This page is slow" is the most common production ticket you will get. The answer is almost always an index, an N+1, or fetching too much.',
        bullets: [
          'An index is a sorted structure (usually a B-tree) that turns a full table scan into a lookup. It costs disk and slows every write, so index deliberately.',
          'Index the columns you filter, join and sort on - especially every foreign key.',
          'Composite indexes are order-sensitive: an index on `(customer_id, created_at)` helps `WHERE customer_id = ?` and `WHERE customer_id = ? ORDER BY created_at`, but not `WHERE created_at = ?` alone.',
          'Wrapping a column in a function (`WHERE LOWER(email) = ?`) or leading with a wildcard (`LIKE "%x"`) prevents index use unless you build a matching expression index.',
          'Read the plan: `EXPLAIN` / `EXPLAIN ANALYZE` (Postgres, MySQL) or the execution plan in SQL Server. Look for sequential/table scans on big tables.',
          'Always paginate. `LIMIT`/`OFFSET` is simple but degrades on deep pages; keyset ("seek") pagination `WHERE (created_at, id) < (?, ?)` stays fast.',
          'Fetch only the columns you need - covering indexes can then answer the query without touching the table.',
        ],
        code: {
          lang: 'sql',
          src: `CREATE INDEX idx_orders_customer_created
    ON orders (customer_id, created_at DESC);

EXPLAIN ANALYZE
SELECT id, total_cents
FROM   orders
WHERE  customer_id = $1
ORDER BY created_at DESC
LIMIT 20;

-- not sargable: the index on email cannot be used
WHERE LOWER(email) = 'ada@x.com';
-- fix: store normalised, or create an expression index
CREATE INDEX idx_users_email_lower ON users (LOWER(email));

-- keyset pagination beats OFFSET 100000
WHERE (created_at, id) < ($1, $2) ORDER BY created_at DESC, id DESC LIMIT 20;`,
        },
        gotchas: [
          'Indexing every column makes writes slow and the optimiser worse, not better.',
          '`OFFSET 500000` still reads and discards half a million rows.',
          'A missing index on a foreign key makes cascading deletes and joins crawl.',
        ],
        interview: [
          'How does an index make a query faster, and what does it cost?',
          'How would you debug a slow endpoint that hits the database?',
          'Why is `LIKE "%term%"` slow?',
        ],
      },
      questions: [
        {
          id: 'sql-p-1',
          type: 'mcq',
          prompt: 'What is the cost of adding an index?',
          choices: [
            'None, always add them',
            'Extra storage and slower INSERT/UPDATE/DELETE, since every write must also maintain the index',
            'Reads get slower',
            'It locks the table permanently',
          ],
          answer: 1,
          explain: 'Indexes trade write throughput and disk for read speed. The right answer in an interview is "index what you actually filter, join and sort on, then verify with the query plan" - not "index everything".',
        },
        {
          id: 'sql-p-2',
          type: 'mcq',
          prompt: 'You have an index on `(customer_id, created_at)`. Which query does **not** benefit?',
          choices: [
            '`WHERE customer_id = 1`',
            '`WHERE customer_id = 1 ORDER BY created_at`',
            '`WHERE created_at > "2024-01-01"`',
            '`WHERE customer_id = 1 AND created_at > "2024-01-01"`',
          ],
          answer: 2,
          explain: 'A composite index is sorted by its leading column first, like a phone book by surname then first name. You cannot use it to search by first name alone. This "leftmost prefix" rule is a very common question.',
        },
        {
          id: 'sql-p-3',
          type: 'mcq',
          prompt: 'A list endpoint slowed down as data grew. What do you check first?',
          choices: [
            'Add more RAM',
            'Look at the query plan for scans, confirm indexes on the filter/join columns, and check for N+1 queries and missing pagination',
            'Rewrite it in a different language',
            'Add a cache immediately',
          ],
          answer: 1,
          explain: 'Measure before changing anything. Caching a slow query hides the problem until the cache misses. The systematic answer - plan, indexes, N+1, pagination - is what marks a mid-level engineer.',
        },
        {
          id: 'sql-p-4',
          type: 'mcq',
          prompt: 'Why is `WHERE name LIKE "%smith%"` slow on a large table?',
          choices: [
            'LIKE is always slow',
            'A leading wildcard means the B-tree ordering is useless, so the engine scans every row',
            'It only works on indexed columns',
            'It converts the column to text',
          ],
          answer: 1,
          explain: 'A prefix search (`LIKE "smith%"`) *can* use the index because the sorted order still applies. For genuine substring or fuzzy search you need full-text search, a trigram index (Postgres `pg_trgm`), or a dedicated search engine.',
        },
        {
          id: 'sql-p-5',
          type: 'flash',
          prompt: 'A `GET /orders` endpoint takes 8 seconds in production but is instant locally. How do you investigate?',
          answer: 'First reproduce with production-like data volume, since local databases are usually tiny. Check the API trace to see where the time goes - database, serialisation or a downstream call. If it is the database, capture the actual SQL (EF Core logging or the DB\'s slow query log) and count the statements: hundreds of similar queries means an N+1, fixed with Include or a projection. Run EXPLAIN ANALYZE on the slow statement and look for sequential scans, bad row estimates, or a sort that spills to disk - typically a missing index on the filter or join column. Check that the endpoint paginates and does not SELECT * a wide table or return the entire history. Then confirm the fix against the same data volume, and add an alert on the endpoint\'s p95 latency so the next regression is caught before a user reports it.',
          explain: 'The structure matters more than any single fix: reproduce with real data, measure, read the plan, fix the cause, verify, then add monitoring.',
        },
      ],
    },
  ],
};
