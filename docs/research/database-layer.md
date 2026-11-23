# `SimpleSAML\Database` versus Doctrine DBAL

Research for issue #8. Facts only; the decision belongs to a later ticket.

## Sources

| Source | Revision |
| --- | --- |
| `simplesamlphp/simplesamlphp`, branch `simplesamlphp-2.5` | `6e34a73` (2026-11-10) |
| `simplesamlphp/simplesamlphp-module-oidc`, `master` | `f813c29` (2026-11-05) |
| `simplesamlphp/simplesamlphp-module-webauthn`, `master` | `af43877` (2026-11-13) |
| `simplesamlphp/simplesamlphp-module-casserver`, `master` | `bd3b749` (2026-11-17) |
| `simplesamlphp/simplesamlphp-module-consent`, `master` | `d3ca5e0` (2026-08-25) |
| `simplesamlphp/simplesamlphp-module-sqlauth`, `master` | `62de307` (2026-11-02) |
| `doctrine/dbal` | tag `4.6.0` (2026-11-14) |
| `doctrine/migrations` | tag `3.9.9` (2026-11-22) |
| Packagist metadata (`repo.packagist.org/p2/...`) | read 2026-11-23 |

Paths below are relative to the repository named in each section. Module
`master` branches all require SimpleSAMLphp 2.5 and PHP `^8.3` in their
`composer.json`.

## 1. What `SimpleSAML\Database` is in 2.5

`src/SimpleSAML/Database.php` is 332 lines: a thin wrapper over raw PDO.

### Public surface (complete)

| Method | Line | Behaviour |
| --- | --- | --- |
| `getInstance(?Configuration $altConfig = null)` | 64 | Singleton per configuration hash (`generateInstanceId`, 134-153) |
| `applyPrefix(string $table): string` | 205 | Concatenates `database.prefix` and the table name |
| `write(string $stmt, array $params = []): int\|bool` | 272 | Prepared statement on the primary, returns `rowCount()` |
| `read(string $stmt, array $params = []): PDOStatement` | 286 | Prepared statement on a random secondary, or the primary if none |
| `readPrimary(string $stmt, array $params = []): PDOStatement` | 306 | Prepared statement on the primary |
| `getLastError(): array` | 317 | `PDO::errorInfo()` of the last failure |
| `getDriver(): string` | 328 | `PDO::ATTR_DRIVER_NAME` of the primary |

### What it offers

- **Configuration reuse.** Reads `database.dsn`, `database.username`,
  `database.password`, `database.driver_options`, `database.persistent`,
  `database.secondaries` and `database.prefix` from the global configuration
  (lines 87-123; documented in `config/config.php.dist` 499-541). A module can
  pass its own `Configuration` with the same keys to get a separate connection
  (class docblock, lines 20-22).
- **Primary/secondary.** `read()` picks a secondary with `rand()` (187-195);
  `write()` and `readPrimary()` always use the primary. There is no stickiness:
  a `read()` after a `write()` in the same request can hit a lagging
  secondary unless the caller uses `readPrimary()` (docblock 294-300).
- **Table prefix.** `applyPrefix()` only; the caller must apply it to every
  table name by hand.
- **Error handling.** `PDO::ERRMODE_EXCEPTION` and
  `PDO::ATTR_EMULATE_PREPARES = false` (171-172). `PDOException` is rethrown as
  a plain `\Exception("Database error: ...")` (175-177, 237-240), so SQLSTATE
  is only reachable through `getLastError()`.
- **Parameter binding.** Named parameters, bound as `PDO::PARAM_STR` unless the
  value is `[value, PDO::PARAM_*]` (226-232).

### What it lacks

- **Transactions.** There is no `beginTransaction`/`commit`/`rollBack` and no
  accessor for the PDO object: `$dbPrimary` is `private` (38) and nothing
  returns it. `beginTransaction` does not appear anywhere under `src/` or
  `modules/` of the 2.5 branch. Sending `BEGIN`/`COMMIT` as SQL through
  `write()` is possible in principle because all writes share one PDO
  connection, but it is not an API, PDO's own transaction state would not
  track it, and it is unverified against the three target engines.
- **Schema migrations.** None. No version table, no migration runner.
- **Schema abstraction.** None. Callers write DDL per driver and branch on
  `getDriver()`.
- **Type mapping.** None. Values go in as strings by default and come out as
  whatever PDO returns for the driver.
- **Portability helpers.** No upsert, no identifier quoting, no pagination or
  date helpers. (The SQL session store has its own `insertOrUpdate()` with a
  `switch` per driver, `src/SimpleSAML/Store/SQLStore.php:288`, but that class
  is not built on `SimpleSAML\Database`.)
- **Dependency injection.** Static singleton with a private constructor (85);
  tests need a real `Configuration` and a real database (SQLite in core's own
  `tests/src/SimpleSAML/DatabaseTest.php`).

### Inconsistencies found in core

- `database.options` is in `config.php.dist` (line 506) but nothing under
  `src/` or `modules/` reads it; the code reads `database.driver_options`.
- `database.persistent` defaults to `true` in code (88, 142) while
  `config.php.dist` ships `false` (521). An installation that omits the key
  gets persistent connections.
- `docs/simplesamlphp-database.md:70-74` says DDL can skip prepared statements
  with `$db->write($sql, false)`. In 2.5 the signature is
  `write(string $stmt, array $params = [])` under `strict_types`, and the
  private `exec()` (253) has no caller. DDL therefore goes through
  `prepare()`/`execute()` with native prepares.
- The secondary array in `config.php.dist` shows a `persistent` key (line 539)
  that the constructor ignores; secondaries reuse the primary's driver options
  (112-121).

## 2. Dependency set of 2.5

From `composer.json` of the 2.5 branch:

- `php: ^8.3` (line 49).
- Symfony components pinned to `~7.4` (lines 80-101), including
  `symfony/console`, `symfony/framework-bundle`, `symfony/dependency-injection`
  and `symfony/var-exporter`.
- `psr/log: ~3.0` (71).
- `ext-pdo` is only a suggestion (119); `ext-pdo_sqlite` is `require-dev` (107).
- **No Doctrine package is required**, and none is installed: `composer.lock`
  has no `"name": "doctrine/..."` entry. Doctrine appears in the lock only in
  the `conflict`/`require-dev`/`suggest` sections of Symfony packages, notably
  `symfony/cache` and `symfony/http-foundation` conflicting with
  `doctrine/dbal: <3.6` (`composer.lock` 1607, 2911).

Core already has a Symfony Console entry point: `bin/console` boots
`SimpleSAML\Kernel` for a module chosen with `--module` and runs
`SimpleSAML\Console\Application`; core commands live in
`src/SimpleSAML/Command/` and use `#[AsCommand]`.

## 3. Doctrine DBAL and Doctrine Migrations

### Current majors and requirements (Packagist)

| Package | Latest stable | Requires |
| --- | --- | --- |
| `doctrine/dbal` | 4.6.0 | `php ^8.2`, `doctrine/deprecations ^1.1.5`, `psr/cache ^1\|^2\|^3`, `psr/log ^1\|^2\|^3` |
| `doctrine/dbal` (previous major) | 3.10.7 | `php ^7.4 \|\| ^8.0`, plus `doctrine/event-manager` |
| `doctrine/migrations` | 3.9.9 | `php ^8.1`, `doctrine/dbal ^3.6 \|\| ^4`, `doctrine/deprecations`, `doctrine/event-manager ^1.2 \|\| ^2.0`, `psr/log`, `symfony/console ^5.4..^8.0`, `symfony/stopwatch ^5.4..^8.0`, `symfony/var-exporter ^6.2..^8.0` |

`doctrine/migrations` has no stable 4.x. DBAL's own
`docs/en/reference/supported-versions.rst` mentions an upcoming 5.0.

### Conflict check against 2.5

Resolved with Composer 2.11.2 on the 2.5 `composer.json` + `composer.lock`
(`composer require --dry-run --no-plugins --no-scripts
--ignore-platform-req=ext-* doctrine/dbal:^4.6 doctrine/migrations:^3.9`):

```
Lock file operations: 5 installs, 0 updates, 0 removals
  - Locking doctrine/dbal (4.6.0)
  - Locking doctrine/deprecations (1.2.0)
  - Locking doctrine/event-manager (2.1.1)
  - Locking doctrine/migrations (3.9.9)
  - Locking symfony/stopwatch (v8.1.0)
```

No conflict; no existing package is updated or removed. Caveats:

- The dry run ran on PHP 8.5, so Composer picked `symfony/stopwatch` 8.1.0.
  On PHP 8.3 (the 2.5 minimum) it would have to resolve to a 7.x release;
  7.4.8 requires `php >=8.2`. That resolution is unverified.
- Nothing was installed or executed; runtime behaviour is unverified.
- Footprint: DBAL alone adds 2 packages (`dbal`, `deprecations`). Migrations
  adds 3 more (`migrations`, `event-manager`, `stopwatch`). `psr/cache` and
  `psr/log` are already in the core lock.

### What DBAL adds (from the 4.6.0 tree)

- **Transactions**, with nesting emulated through savepoints
  (`docs/en/reference/transactions.rst:66-108`).
- **Platforms** for MySQL, MariaDB, PostgreSQL, SQLite, SQL Server, Oracle and
  Db2 (`src/Platforms/`). Minimum server versions in 4.x: MySQL 5.7.9,
  MariaDB 10.4.3, PostgreSQL 10.0, SQLite 3.37.2
  (`docs/en/reference/supported-versions.rst`).
- **Schema representation and diff**: `Schema::toSql($platform)`,
  `SchemaManager::introspectSchema()`, `Comparator::compareSchemas()`
  (`docs/en/reference/schema-representation.rst:100-115`,
  `schema-manager.rst:211-276`).
- **Type mapping**, including `json` and `jsonb` (`src/Types/Types.php:28-31`).
- **Query builder** and typed exceptions (`docs/en/reference/query-builder.rst`).
- **Primary/replica** through
  `Doctrine\DBAL\Connections\PrimaryReadReplicaConnection`, which takes
  `primary` and `replica` parameter arrays and a `keepReplica` flag
  (`src/Connections/PrimaryReadReplicaConnection.php:67-119`).

### What DBAL does not give for free

- **No reuse of the core connection.** `SimpleSAML\Database` exposes no PDO
  handle, and `DriverManager::getConnection()` in 4.x has no `pdo` parameter
  (`src/DriverManager.php`; only `driver`, `driverClass`, `wrapperClass` and
  per-driver parameters). `Doctrine\DBAL\Driver\PDO\Connection` does take a
  `PDO` in its constructor but is marked `@internal`
  (`src/Driver/PDO/Connection.php:18-19`). A DBAL-based module opens its own
  connection.
- **No reuse of `database.dsn` as is.** Core uses PDO DSNs
  (`mysql:host=localhost;dbname=saml`). DBAL takes a parameter array or a
  URL-style DSN through `Doctrine\DBAL\Tools\DsnParser`
  (`pdo-mysql://localhost:4486/foo`, `docs/en/reference/configuration.rst:63-115`).
  Reusing the core keys needs a translation layer in the module, or the module
  needs its own connection settings. No ready-made PDO-DSN parser was found in
  DBAL 4.6.0 (searched `src/Tools/` and the configuration docs; not exhaustive).
- **No table prefix.** The DBAL reference docs do not mention one;
  `database.prefix` would have to be applied by the module to table names and
  to the migrations metadata table.

### What Doctrine Migrations adds (from the 3.9.9 tree)

- Versioned migration classes, a metadata table (default name
  `doctrine_migration_versions`, configurable:
  `src/Metadata/Storage/TableMetadataStorageConfiguration.php:10`), and
  Symfony Console commands (`migrate`, `status`, `diff`, `execute`, ...).
- It can be wired without a framework bundle from an existing DBAL
  connection: `DependencyFactory::fromConnection(new ExistingConfiguration(...),
  new ExistingConnection($connection))`
  (`docs/en/reference/custom-configuration.rst:36-49`), so its commands can be
  registered in another Symfony Console application.
- Migrations are transactional by default; `all_or_nothing` wraps a whole run
  (`docs/en/reference/configuration.rst:141-143`). This "only works if your
  database supports transactions for DDL statements" (line 230): MySQL and
  Oracle commit implicitly on DDL (`docs/en/explanation/implicit-commits.rst`).
  MariaDB is not named there; it is assumed to behave like MySQL (unverified
  here).

Whether Doctrine's commands can be registered through the module command
mechanism of `bin/console` in 2.5 was not checked.

## 4. How table-owning code handles schemas today

No core component or official module inspected uses Doctrine or any migration
library. Five distinct patterns exist.

### A. `_tableVersion` table, lazy upgrade at connection time (core SQL store)

`src/SimpleSAML/Store/SQLStore.php` opens **its own PDO** from `store.sql.*`
(68-92), not `SimpleSAML\Database`. Its constructor creates
`<prefix>_tableVersion (_name, _version)` if missing (99-110) and each table
owner compares an integer version and runs hand-written DDL:

- `initKVTable()` (206-242): `LONGTEXT` on MySQL, `DATETIME` on SQL Server,
  different index syntax per driver. A version 1 table throws "No upgrade path
  available" (211-216).
- The `_tableVersion` table upgrades itself with one `switch` branch per
  driver (pgsql, sqlsrv, sqlite, mysql, default; 118-197). SQLite needs
  create-copy-drop-rename.
- `getTableVersion()`/`setTableVersion()` are public (252, 268) and reused by
  `modules/saml/src/SP/LogoutStore.php` (34-143, currently at version 5, with
  per-driver `ALTER` branches) and `modules/saml/src/IdP/SQLNameID.php`
  (91-104).

Everything runs on the first web request that touches the store. No
transaction wraps the DDL and the version bump.

`simplesamlphp-module-casserver` copies this pattern into its own class with
its own PDO (`src/Cas/Ticket/SQLTicketStore.php:54-191`).

### B. `CREATE TABLE IF NOT EXISTS` on demand, no versioning

- Core PDO metadata handler:
  `src/SimpleSAML/Metadata/MetaDataStorageHandlerPdo.php:290-316`
  (`initDatabase()`), using `SimpleSAML\Database`. One driver branch
  (`MEDIUMTEXT` on MySQL, `TEXT` elsewhere). Invoked by the standalone scripts
  `bin/initMDSPdo.php:25` and `bin/importPdoMetadata.php:20`. No upgrade path.
- `simplesamlphp-module-webauthn`: `src/WebAuthn/Store/Database.php:57-110`
  probes with `SELECT COUNT(*)` in the constructor and creates the tables on
  failure, branching on `mysql`/`pgsql` for binary and timestamp types. Uses
  `SimpleSAML\Database` with a module-supplied configuration.

### C. Hand-rolled migration runner on `SimpleSAML\Database` (oidc)

`simplesamlphp-module-oidc`, `src/Services/DatabaseMigration.php` (543 lines),
is the closest precedent to what the Console needs:

- A versions table `oidc_migration_versions (version VARCHAR(191) PRIMARY KEY)`
  created with `CREATE TABLE IF NOT EXISTS` and passed through `applyPrefix()`
  (55-65, 168-171).
- One method per migration, `versionYYYYMMDDHHMMSS()`, called from a manual
  `if (!in_array(...))` chain in `migrate()` (67-166). `isMigrated()` compares
  method names with stored versions by reflection (38-53).
- Raw DDL strings with driver branches; the code comments that the non-MySQL
  branch exists for SQLite "used in unit tests" (409-426). PostgreSQL is not
  branched explicitly.
- No transactions: each migration runs its DDL and then inserts its version
  row as separate `write()` calls. A failure midway leaves a half-applied
  migration.
- Triggered explicitly: `bin/install.php` (23-37) or an admin page
  (`src/Controllers/Admin/ConfigController.php:32-52`); the admin UI warns
  when migrations are pending (`hooks/hook_federationpage.php:36`). Documented
  in `docs/2-oidc-installation.md:91` and `docs/6-oidc-upgrade.md`.

### D. Schema in the documentation, applied by the administrator (consent)

`simplesamlphp-module-consent` documents the `CREATE TABLE` in
`docs/consent.md:94` and opens its own PDO from module options
(`src/Consent/Store/Database.php:448`). No code creates or upgrades the table.

### E. No owned tables (sqlauth)

`simplesamlphp-module-sqlauth` only queries tables the deployer already has;
it opens its own PDO per configured database (`src/Auth/Source/SQL2.php:376`).
`CREATE TABLE` appears only in docs and tests.

### Related: keys in the database

`src/SimpleSAML/Utils/Crypto.php:410-437` loads `pdo://<id>` certificates and
keys through `SimpleSAML\Database`, honouring `database.prefix` unless
`cert.pdo.apply_prefix` is false. `config.php.dist:95-100` states those tables
"are not created or managed by simplesaml".

## 5. Side-by-side

| Concern | `SimpleSAML\Database` | Doctrine DBAL 4 (+ Migrations 3) |
| --- | --- | --- |
| Extra dependencies | none | 2 packages (5 with Migrations); resolves cleanly against the 2.5 lock |
| Reuses `database.*` config | yes, natively | not directly: PDO DSN must be translated or a second config added |
| Shares the core connection | yes | no (second connection per request that uses it) |
| Primary/secondary | yes, random secondary, `readPrimary()` | yes, `PrimaryReadReplicaConnection` |
| Table prefix | `applyPrefix()` | none built in |
| Transactions | none in the API | yes, with savepoint nesting |
| Schema abstraction / diff | none | yes |
| Type mapping | none | yes (incl. JSON) |
| Migrations | none; modules hand-roll them | versioned classes, metadata table, console commands |
| DDL atomicity | none | PostgreSQL and SQLite only; MySQL commits implicitly |
| Precedent in official modules | webauthn, oidc, PDO metadata handler | none found |
| Engines exercised by upstream | SQLite in tests; MySQL/pgsql/sqlsrv branches in code | all three targets are first-class platforms |

## 6. Open points for the decision ticket

- The Console's Publication validates and writes a versioned Snapshot record;
  whether that needs a real transaction is a design question. With the core
  wrapper, a transaction means either `BEGIN`/`COMMIT` as raw SQL or the
  module's own PDO, i.e. the wrapper's main benefit (shared connection) is
  partly lost in both options.
- A third option exists in practice: the module's own PDO plus a hand-rolled
  runner (patterns A and C). It was not asked about but is what most official
  modules do.
- Unverified: PHP 8.3 resolution of `symfony/stopwatch`; runtime coexistence of
  Doctrine Migrations commands with `bin/console`; MariaDB DDL transaction
  behaviour; raw `BEGIN`/`COMMIT` through `Database::write()` with native
  prepares on each engine.
