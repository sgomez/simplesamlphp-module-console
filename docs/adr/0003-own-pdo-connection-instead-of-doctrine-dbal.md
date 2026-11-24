# Own PDO connection instead of Doctrine DBAL

The Console talks to its database through a PDO connection of its own, built from the core `database.*` settings, with hand-written SQL per engine and a hand-rolled migration runner. `SimpleSAML\Database` cannot be used because it has no transaction API, hides its PDO and reads from a random secondary, and a Publication needs one transaction. Doctrine DBAL was the other candidate: it brings one schema for three engines, but also five packages no SimpleSAMLphp module depends on, and it cannot consume the core PDO-style DSN or table prefix, so the administrator would configure the database twice. The Console's SQL surface is a few tables and plain CRUD, and integration tests against the three engines are needed either way.

## Considered Options

- **`SimpleSAML\Database`**: rejected; no transactions and no access to the underlying PDO. `simplesamlphp-module-oidc` lives with this because each of its operations touches one row.
- **Doctrine DBAL with `doctrine/migrations`**: rejected for the reasons above. Installs cleanly next to SimpleSAMLphp 2.5, so it stays available.

## Consequences

- DDL is written by hand for PostgreSQL, MySQL/MariaDB and SQLite. `oidc` does the same but only really exercises MySQL and SQLite, so it is no proof that this stays cheap.
- JSON lives in text columns, decoded and validated in PHP; anything searched for gets a column of its own. No SQL reaches inside the JSON.
- Migrations are forward-only and hold exactly one statement each on every engine, because DDL is not transactional on MySQL/MariaDB and a migration number must mean the same everywhere. Undoing one means restoring a backup.
- Concurrency (two Publications, two migration runs) is settled by conditional updates of the pointer row and by primary keys, never by advisory locks, which differ per engine.
- A lost race does not look the same on every engine, so the persistence layer turns all its shapes into one conflict error: zero rows updated, a primary-key clash on the Snapshot, SQLSTATE `40001` or `40P01`, MariaDB driver code 1020 (11.6.2 and later, reported as `HY000`) and `SQLITE_BUSY`. This holds for every write, not only a Publication.
- A Publication runs at `REPEATABLE READ`, set with `SET TRANSACTION ISOLATION LEVEL`: it reads entities and authsources in separate queries and they must describe one instant. `READ COMMITTED` would give the same symptom on every engine at the cost of that. On SQLite it opens with `BEGIN IMMEDIATE` and a 5 second `busy_timeout`, so the loser waits and then fails on the hash check or the zero-rows path.
- `pdo_mysql` uses native prepares, so a Snapshot is sent unescaped and its size can be checked against `max_allowed_packet` before the `INSERT`.
- SQL is confined to a persistence namespace behind repository interfaces, with an architecture check forbidding `PDO` elsewhere. That is the seam for moving to DBAL if the SQL surface grows.
