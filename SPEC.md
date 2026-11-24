# Console: specification for v1

This document specifies v1 of the Console, a SimpleSAMLphp module that manages SAML entities and authentication sources in a database instead of hand-edited PHP files.

- Terms such as Snapshot, Publication, Pending change, Override or Shadowed are defined in [`GLOSSARY.md`](GLOSSARY.md) and used here with that meaning only.
- The JSON Schemas, the DDL and the example documents are files under [`docs/spec/`](docs/spec/). They are part of the specification.
- The ADRs under [`docs/adr/`](docs/adr/) explain why a decision was taken. What was decided is stated here.
- A paragraph starting with `OPEN:` marks a question that is not decided yet. Nothing may be built on a guess about it.

## 1. Scope and non-goals

### 1.1 What the Console is

The Console is a SimpleSAMLphp module with a web interface for the SimpleSAMLphp administrator. It stores managed entities and managed authsources in a relational database, validates them, and delivers them to every node of a deployment through an explicit Publication.

It manages three metadata sets: `saml20-sp-remote`, `saml20-idp-remote` and `saml20-idp-hosted`. It manages authentication sources of five Authsource types: `saml:SP`, `ldap:Ldap`, `sqlauth:SQL2`, `multiauth:MultiAuth` and `exampleauth:UserPass`.

The Console coexists with everything SimpleSAMLphp already reads. Hand-written metadata files, the output of `metarefresh`, the core PDO metadata tables and `config/authsources.php` keep working unchanged. The Console shows what they contain read-only, reports collisions with what it manages, and never writes to them.

### 1.2 Baseline

| | Requirement |
| --- | --- |
| SimpleSAMLphp | 2.5. Earlier 2.x minors are not supported. |
| PHP | `^8.4`. SimpleSAMLphp 2.5 itself accepts 8.3; the module does not. |
| Database | PostgreSQL 15, MariaDB 10.11, MySQL 8.4 or SQLite 3.24.0, as a minimum (section 4.2). |
| Browser | JavaScript is required. There is no fallback without it. |
| Language | English only. The Console has no translations and no language selector. |

The module is the maintainer's own package. It follows the conventions of official SimpleSAMLphp modules for packaging, routing, controllers, templates and assets, except that its pages use a shell and a stylesheet of their own (section 10). Adoption by the SimpleSAMLphp project is not a goal.

### 1.3 Principles

These hold across the whole specification.

- **SSO never reads the database.** A request served by SimpleSAMLphp reads only the node-local copy of the Snapshot. The one exception is a node that has no local Snapshot at all, which fetches the current one during its first request (section 3.5).
- **Saving is not publishing.** A save changes only the Console's database. Nodes change what they serve only after a Publication, which validates all Pending changes together and produces a numbered, immutable Snapshot. A Rollback makes another retained Snapshot the current one.
- **The database is the only thing nodes share.** There is no shared storage and the Console does not know the nodes or push to them.
- **The Console never writes hand-written configuration.** It does not create, modify or delete any file under `config/` or `metadata/`, nor any row of the core PDO metadata tables.
- **A bad record never takes SSO down.** A malformed database record, a corrupt Snapshot or an unreachable database never causes a fatal error and never stops the remaining entities, authsources or file-based sources from loading (section 11).
- **Installing takes no more than editing configuration files.** The module registers no commands. Schema migration, Publication, Rollback, Import and status are web only.
- **One role.** Whoever passes SimpleSAMLphp's `requireAdmin()` is a full administrator of the Console.

### 1.4 In scope

- Creating, editing, enabling, disabling and deleting managed entities of the three sets and managed authsources of the five Authsource types, through a form or as PHP text (sections 5, 6 and 10).
- Validation on save and, across objects, at Publication (sections 5, 6 and 8).
- Key references and Secret references (section 7).
- Pending changes, Publication, Rollback and Snapshot retention (section 8).
- Delivery of Snapshots to nodes, and node status (sections 3.5 and 11).
- A read-only view of External entities and File authsources, Overrides, and Import from `flatfile` and `pdo` metadata sources (section 9).
- Creating objects from pasted metadata XML or PHP (section 9).
- An Audit trail of every change of state (sections 4.4 and 8).
- The test harness, the local environment, the GitHub Actions workflows and the repository security policy (sections 12 to 14).

### 1.5 Non-goals

The Console does none of the following in v1.

- **Self-service registration.** There is no per-user ownership of entities and nothing is reused from `simplesamlphp-module-metaedit`, whose files are neither read nor imported.
- **Fetching federation metadata.** `metarefresh` does it. The Console does not edit the `metarefresh` configuration either.
- **Fetching metadata from a URL** when creating an entity. The administrator pastes it.
- **File uploads.** A chosen file is read by the browser into a text area; the server never receives a multipart upload.
- **An export format.** PHP text is the interchange format between Consoles.
- **Metadata sets other than the three listed**, ADFS and WS-Fed included.
- **Authentication sources of any other type.** They stay File authsources. A File authsource cannot be copied into the Console from its listing, although its PHP can be pasted when its type is one of the five.
- **Storing, generating or uploading private keys.** A private key is always a file each node provides.
- **Encrypting secrets in the database.** See [ADR 0001](docs/adr/0001-no-application-level-encryption-of-secrets.md).
- **User management.** Users live behind the authsource.
- **Editing `config.php`.** It holds what the Console needs to start.
- **Delegated or per-entity permissions.**
- **Deleting the originals of imported entities**, whether files or core PDO rows.
- **Background checks of Overrides against their external source.** The check runs only when the administrator looks.
- **Command-line tools and a JSON status endpoint.**
- **A SimpleSAMLphp theme.** Login, discovery, consent, error and core admin pages keep their own look.
- **Translations.**

### 1.6 Accepted risks

- A node that starts with no local Snapshot while the database is down has nothing to serve from the Console until the database returns.
- A leaked database or backup exposes every secret stored as a literal, and every retained Snapshot holds them too. Protecting the database and its backups (permissions, TLS, disk encryption) is the deployment's job.
- The Audit trail is append-only by code only. It is not tamper-proof against someone with write access to the database.
- With the default `core:AdminPassword` authsource, the Audit trail records what changed and when, not who.
- A site that keeps the core `pdo` source in `metadata.sources` loses the guarantee that SSO survives a database outage, because that source's constructor throws. The Console can only warn about it.
- Every node must run the same module version as the Console and carry the same `metadata.sources`, File authsources, key files and secrets. The Console sees only the node it runs on and cannot verify the others.
- Removing or renaming a managed authsource in a Publication fails logins that are in flight, as a hand edit of `authsources.php` already does.

## 2. Installation and configuration

### 2.1 Package

The module is the Composer package `sgomez/simplesamlphp-module-console` and installs as the SimpleSAMLphp module `console`. Its production dependencies beyond SimpleSAMLphp 2.5 are listed in section 3.7.

### 2.2 Installation steps

Installing the Console consists of these steps and no others. None of them runs a command inside a node other than Composer.

1. Require the package with Composer.
2. Enable the modules `console` and `cron` in `module.enable`.
3. Make sure `config.php` holds the `database.*` settings of the database the Console is to use, or point the Console at another one in `module_console.php` (section 2.4).
4. Add the Console's source to `metadata.sources` (section 2.5).
5. Add the fragment to `config/authsources.php` (section 2.6).
6. Give the web server user a writable, node-local directory for Snapshots (section 2.3).
7. Open the Console as the SimpleSAMLphp administrator and apply the pending migrations with the button on the page it shows (section 4.6).
8. On a deployment with more than one node, have an external scheduler call the core `cron` URL of every node (section 2.7).

Steps 1 to 6 are repeated identically on every node. Step 7 is done once per deployment.

### 2.3 Module configuration

The module reads its options from `config/module_console.php`. The file is optional; every option has a default.

| Option | Default | Meaning |
| --- | --- | --- |
| `useridattr` | unset | Attribute of the `admin` session whose first value is recorded as the identity in the Audit trail and on Snapshots. When unset, or when the attribute is missing or empty, the identity is the constant `admin`. Access is never refused because of it. |
| `cron_tag` | unset | The `cron` tag on which the node checks for a newer Snapshot. When unset, the node checks on every tag. |
| Database section | core `database.*` | Points the Console at a different database than the one in `config.php` (section 2.4). |
| Snapshot directory | see `OPEN` below | Node-local directory holding the node's copies of Snapshots. Writable by the web server user only. |
| Secrets directory | `/run/secrets` | Directory in which `%secret(name)%` is resolved on the node. |
| Node identifier | the hostname | Name under which the node reports its status. |
| Node forgetting interval | one hour | Time without a check after which a node is dropped from the node list. |
| Snapshot retention | 10 | Number of Snapshots kept in the database. |
| Certificate expiry warning | 30 days | How long before its expiry a certificate is flagged. |

OPEN: the keys of the last seven options, the shape of the database section and the default Snapshot directory are not decided.

### 2.4 Database settings

By default the Console builds its connection from the core settings `database.dsn`, `database.username`, `database.password` and `database.prefix`. It ignores `database.slaves` and `database.persistent`: it always uses the primary and never a persistent connection.

The optional database section of `module_console.php` replaces those four values with its own.

SQLite is for single-node deployments and for tests. In a container its file needs a persistent volume. A deployment with more than one node requires PostgreSQL, MariaDB or MySQL.

### 2.5 `metadata.sources`

The administrator adds one entry of a type provided by the module to `metadata.sources` in `config.php`. It takes no database settings: it serves the node-local Snapshot.

The order of `metadata.sources` decides which source wins when the same entity ID exists in more than one for the same set; core has no other mechanism. The documentation recommends listing the Console's source first. The Console does not enforce it; it reports each collision as an Override or as Shadowed according to the `config.php` of the node serving the page (section 9).

The core `pdo` source may stay in `metadata.sources`. The Console then warns on that node's status screen that SSO depends on the database.

OPEN: the class name of the module's `MetadataStore`, and so the `type` value of the entry, is not decided.

### 2.6 The `authsources.php` fragment

Managed authsources reach core through a fragment the administrator adds by hand, once, to `config/authsources.php`. The Console never writes it. See [ADR 0005](docs/adr/0005-managed-authsources-through-a-hand-added-fragment.md).

The fragment is one expression: a static call into a class of the module, guarded with `class_exists()`. It is the last thing the file executes, in one of two documented forms:

- as the last statement, assigning the result of the call on `$config` back to `$config`; or
- as the file's `return`, wrapping the array of file authsources in the call.

The fragment itself never changes between module versions. All logic lives in the method it calls (section 3.2).

Without the fragment, managed authsources can be edited and published but have no effect on that node, and the node reports it as a problem when the current Snapshot holds managed authsources.

OPEN: the class and method the fragment calls are not decided, so the literal text of the fragment cannot be given yet.

### 2.7 `cron`

A running node learns of a Publication when the core `cron` module fires. A call every minute is recommended. Triggering the `cron` URL from an external scheduler is the expected setup; nothing runs inside the node's container.

Behind a load balancer the scheduler must reach each node directly, since a call that goes through the balancer updates only the node that receives it.

A single-node deployment needs no `cron` for the Console: the node that serves a Publication request updates itself within that request, and a node with no local Snapshot fetches one on its first request.

### 2.8 What the deployment must keep identical across nodes

- The module version. The Snapshot carries Console documents that each node translates, so a node with other code may translate differently or not at all. Every node is upgraded before the next Publication.
- `metadata.sources`, in the same order.
- The File authsources in `config/authsources.php`, and the modules of every Authsource type in use, installed and enabled.
- The key and certificate files that Key references point to.
- The secrets and environment variables that Secret references name.

### 2.9 Upgrading

Upgrading is a Composer update of the package on every node. SimpleSAMLphp caches each module's routes and services under its `cachedir`, so that cache is cleared as part of the update.

When the new code carries migrations the database lacks, every Console route answers with the pending migrations page until they are applied (section 4.7). Migrations are forward-only: the page says, before applying anything, that undoing one means restoring a backup. SSO is unaffected throughout.

## 3. Architecture

### 3.1 Two sides

The module has two sides that share no code path at run time other than the Snapshot.

**The edit side** is the Console proper: controllers, forms, validation and the database. It runs only for requests to the Console's own routes, made by an authenticated administrator.

**The serving side** is what SimpleSAMLphp calls during SSO: a `MetadataStore` and the method behind the `authsources.php` fragment. Both read the node-local Snapshot from disk and nothing else. They do not depend on the persistence code; the declared exception is the first-request fetch of section 3.5.

```
 administrator                                      SSO request
      │                                                  │
      ▼                                                  ▼
 Console routes ──save──▶ edit tables            MetadataStore, fragment
      │                                                  │
      └──Publication──▶ Snapshot table ──fetch──▶ local Snapshot on disk
                        pointer table     (cron, first request,
                                           or the publishing node)
```

### 3.2 Integration points with SimpleSAMLphp

| Point | Mechanism | Use |
| --- | --- | --- |
| Web interface | Routes under `routing/routes/`, autowired controllers in `src/Controller/`, templates through core's `Template` class, assets under `public/assets/` referenced with `asset()` | Every Console screen |
| Access control | `requireAdmin()` | The only access check (section 3.8) |
| Metadata | A `MetadataStore` class of the module, named in `metadata.sources` | Serves managed entities from the local Snapshot |
| Authsources | A static method of the module, called by the fragment in `authsources.php` | Merges managed authsources from the local Snapshot into the file's array |
| Periodic check | A listener for core's `CronEvent`, under `src/Event/Listener/` | Fetches a newer Snapshot and reports the node's status |
| Sanity check | A listener for core's `SanityCheckEvent` | Shows the node's problems on core's admin page |
| Entry in core's admin interface | A PSR-14 listener of the admin module | Link from core's admin pages to the Console |

The module uses PSR-14 listeners only. It ships no legacy `hooks/` files.

**The `MetadataStore`** extends core's `MetaDataStorageSource`. It reads the `current` pointer once per request, loads the PHP file of the requested set from that version's directory, and catches every error of its own: when the local Snapshot is missing or unreadable it returns no entities and logs a warning, so the other sources keep answering.

**The fragment's method** takes the array of file authsources and returns it merged with the managed ones. It catches every `\Throwable`, leaks no variables into the scope of `authsources.php`, and merges with `+`, so a file authsource always wins over a managed authsource with the same id. An unreadable authsources section is ignored as a whole with a warning; inside a readable one, each entry is checked again (an array, a string at key `0`, a non-numeric id) and only invalid entries are dropped. It records that it ran, which is how a node detects a missing fragment.

**The entry in core's admin interface** never queries the database, or catches its own errors, so a stale schema or an unreachable database never breaks core's admin page.

OPEN: whether the entry in core's admin interface is a tab (`AdminMenuEvent`) or a link on the Configuration tab (`ConfigPageEvent`) is not decided.

### 3.3 Documents, schemas and translators

A managed entity or a managed authsource is stored as a **Console document**: a JSON document that is not the PHP array core expects. Several options do not fit JSON as core takes them (the authsource type at key `0`, credentials inside array keys, absent versus `null`), and Key references, endpoints and localized strings need a regular shape.

Each of the three entity sets and each of the five Authsource types has:

- a **JSON Schema** (2020-12) describing its document, with annotations for sensitive values, Key references, authsource references and presentation;
- a PHP class holding the **cross-field rules** the schema cannot express;
- a **translator** from the document to the array core expects;
- an **inverse translator** from that array back to the document, used by the PHP view, by Import and by creation from pasted configuration.

Authsource schemas are closed: an option outside the schema is rejected. Entity schemas are open through an `extra` bag of uncataloged options. See [ADR 0006](docs/adr/0006-closed-catalog-of-authsource-types.md) and [ADR 0008](docs/adr/0008-open-entity-documents-with-an-extra-bag.md). The schemas and their rules are specified in sections 5 and 6.

The catalog of schemas ships with the module. A deployment or another module cannot add to it.

Translation into core's array happens **on the node**, after Secret references are resolved, never at Publication. The Console itself translates only to show an object as PHP, with Secret references left unresolved.

The Console never instantiates an authsource class and never runs a managed entity through core to validate it.

### 3.4 Publication and the Snapshot

A Publication runs in one database transaction (section 4.8). It revalidates every enabled managed entity and managed authsource, builds one JSON document holding all of them as Console documents, stores it as a new row of the Snapshot table with the next number, a format version and a checksum, and makes it the current one in the pointer table.

Disabled objects do not travel in the Snapshot. Entities and authsources travel in the same Snapshot and are published and rolled back together.

A Snapshot is immutable once stored. A Rollback creates no Snapshot: it changes the pointer to another retained one. Nodes therefore always compare against the current number, never the highest.

The validation rules, the confirmation screens and retention are specified in section 8. See [ADR 0004](docs/adr/0004-nodes-fetch-published-snapshots.md).

### 3.5 Nodes

A node never reads the edit tables. It reads the pointer table and the Snapshot table, and writes its own row of the Node table.

**Fetching.** A node fetches the current Snapshot in three situations:

- **`cron`.** On every `cron` tag, or only on `cron_tag` when set, the node compares the current number with the one it serves and fetches the Snapshot when they differ. The check is idempotent and reports its outcome in the `cron` summary.
- **First request.** A node with no local Snapshot fetches the current one during its first request, under a local lock. This is the only case in which an SSO request reads the database. If nothing has been published yet, the node records that locally and its requests ask no more. After a failed attempt it waits 60 seconds before trying again.
- **Publication.** The node that serves the Publication request updates itself within that request.

**Building the local copy.** After fetching, the node verifies the checksum and the format version, resolves every Secret reference, checks every Key reference, translates each document, and writes the result. An object that cannot be built (an unresolved Secret reference, a current key or certificate that fails its check, a document the node's code cannot translate) is left out of that node's copy alone; the rest is served. The per-object rules are in sections 7 and 11.

A node whose code is older than the Snapshot's format version keeps the local copy it has, or serves nothing from the Console if it has none. It never falls back to an earlier Snapshot.

On every `cron` check the node resolves the Secret references of the current Snapshot again and rewrites its local copy only when the result differs. A rotated secret therefore needs no Publication and takes effect within one `cron` cycle.

**On disk.** The Snapshot directory holds one directory per version, `<dir>/<n>/`, containing:

- one PHP file per set and one for authsources, each a `return [...]` of arrays ready for core;
- a `manifest.json`.

The node's local status (the objects left out with their reason, and the other problems listed below) is kept on disk next to it.

Files are readable by the web server user only (`0600`), because secrets are resolved in them. A `current` pointer names the version being served; it is switched by atomic rename and read once per request. The current and the previous version are kept; older ones are removed.

OPEN: the contents of `manifest.json`, the file names inside a version directory and the form of the local status are not decided. Nor is whether the node that serves a Rollback request updates itself within it, as it does for a Publication.

**Status.** After each check, each first-request fetch and each Publication it serves, the node writes its identifier, the number it serves, the time of the check and a "has problems" flag to the Node table. A failed write is logged and ignored. Nothing else about a node reaches the database.

What the problems are stays on the node's disk and is shown by that node only, on its status screen, in its `cron` summary and in core's sanity check:

- objects left out of its copy, each with its reason;
- managed authsources Shadowed by a file authsource of that node;
- a missing `authsources.php` fragment, when the current Snapshot holds managed authsources;
- the core `pdo` source in `metadata.sources`.

Behind a load balancer the administrator sees which node has problems and has to reach that node to read them.

**With the database down**, a node keeps serving its local copy indefinitely.

### 3.6 Code layout

The module's code under `src/` is split in three layers. Dependencies point inwards only.

| Layer | Holds | May not use |
| --- | --- | --- |
| `Domain` | Documents, validation, translators, Pending changes, the Snapshot | `SimpleSAML\*`, PDO, HTTP |
| `Application` | One use case per class: save, publish, Rollback, Import and the like | PDO, HTTP |
| `Infrastructure` | Persistence, integration with core, controllers, Twig | |

- SQL and `PDO` appear only in the persistence namespace, behind repository interfaces.
- The serving side (the `MetadataStore` and the fragment's method) does not depend on persistence, except for the first-request fetch.
- There is no command bus, no domain events, no CQRS and no value object per scalar. An interface exists only where two real implementations do: the database engines and test doubles.

These boundaries are enforced by the architecture checks of section 12.

### 3.7 Dependencies

| Package | Use | Status |
| --- | --- | --- |
| `opis/json-schema` `^2.6` | JSON Schema 2020-12 validation | Added by the module |
| `nikic/php-parser` | Reading pasted PHP array literals without executing them | Already a production dependency of SimpleSAMLphp 2.5 |
| `symfony/var-exporter` | Writing PHP arrays | Already shipped with SimpleSAMLphp 2.5 |

The module adds no database abstraction layer, no Symfony CSRF component and no JavaScript dependency. Its front end is one stylesheet and one hand-written script served as static files, with no build step.

`opis/json-schema` is configured to report every error rather than stop at the first, and with defaults off: validation never writes a `default` into a document.

### 3.8 Requests

- Every Console route calls `requireAdmin()`. There is no other permission check.
- No GET request changes state. Every state-changing request is a POST carrying a request-forgery token kept in the SimpleSAMLphp session.
- Core's kernel runs no listeners for a module, so both checks are explicit: one service calls `requireAdmin()` and validates the token, and every state-changing action goes through it. A request without a valid token gets a plain HTTP 403 page; nothing is written to the Audit trail and a warning goes to the SimpleSAMLphp log.
- Before anything else, every Console route checks the state of the database and answers with a state page instead of an error when it cannot proceed (section 4.7).
- Pages that carry a stored secret are served with `Cache-Control: no-store`.
- Every page passes core's default Content Security Policy: no inline scripts, no inline styles, no `style` attributes, nothing loaded from another origin.

## 4. Storage

### 4.1 Connection

The Console opens a PDO connection of its own. It uses neither `SimpleSAML\Database` nor Doctrine DBAL; see [ADR 0003](docs/adr/0003-own-pdo-connection-instead-of-doctrine-dbal.md).

- Built from the settings of section 2.4. Always the primary, never persistent.
- `PDO::ERRMODE_EXCEPTION` on every engine.
- `utf8mb4` on MariaDB and MySQL, with native prepared statements.
- `PRAGMA foreign_keys = ON` on SQLite.

SQL is written by hand per engine. It never reaches inside a JSON column.

### 4.2 Engines

| Engine | Minimum version | Use |
| --- | --- | --- |
| PostgreSQL | 15 | Any deployment |
| MariaDB | 10.11 | Any deployment |
| MySQL | 8.4 | Any deployment |
| SQLite | 3.24.0 | Single-node deployments and tests |

The minimum of each server engine is the oldest version its vendor still maintains, and moves when that version reaches its end of life. It is a support policy: what is guaranteed is what the workflows of section 13 run. The server engines are not checked at run time.

SQLite is checked when the connection opens, from `PDO::ATTR_SERVER_VERSION`, because PHP may be built against an older library than the upsert of the Node table needs. Below 3.24.0 every Console route answers with a state page (section 4.7).

### 4.3 Conventions

- **Table names.** Every table is named `<database.prefix>console_<name>`, the versions table included.
- **Keys.** Primary keys are the natural ones: (set, entity ID) for a managed entity, the id for a managed authsource, the number for a Snapshot. There are no surrogate ids, except the auto-increment id of the Audit trail.
- **No foreign keys.** Snapshots are purged and the Audit trail outlives the objects it describes.
- **Identity is immutable.** The set and entity ID of a managed entity and the id of a managed authsource cannot be changed. Renaming is duplicating and deleting.
- **Entity IDs** are at most 1024 bytes and are compared byte for byte, as core's array keys are. The length is checked in PHP.
- **Authsource ids** match `[A-Za-z0-9_.-]+` and are compared byte for byte.
- **Timestamps** are fixed-width ISO-8601 strings in UTC, `2026-11-24T10:15:00Z`, in a `CHAR(20)` column on every engine. SQL does no date arithmetic: thresholds are computed in PHP and compared as strings. Resolution is one second. See [ADR 0009](docs/adr/0009-timestamps-stored-as-utc-text.md).
- **Booleans** are integers 0 and 1.
- **JSON documents** are stored as text, decoded and validated in PHP. Anything SQL searches by has a column of its own: the set, the entity ID and the enabled flag. There is no name column.
- **Column lists are explicit.** No `SELECT *` and no positional `INSERT`.

### 4.4 Tables

The complete DDL is in three files, one statement per migration, numbered as in section 4.6:

- [`docs/spec/ddl/postgresql.sql`](docs/spec/ddl/postgresql.sql)
- [`docs/spec/ddl/mysql.sql`](docs/spec/ddl/mysql.sql), for MariaDB and MySQL
- [`docs/spec/ddl/sqlite.sql`](docs/spec/ddl/sqlite.sql)

The files differ only in what the engines force:

| | PostgreSQL | MariaDB / MySQL | SQLite |
| --- | --- | --- | --- |
| Table options | none | `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4` | none |
| Entity ID | `TEXT COLLATE "C"` | `VARBINARY(1024)` | `TEXT` |
| Authsource id | `VARCHAR(255) COLLATE "C"` | `VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin` | `TEXT` |
| Set | `VARCHAR(32)` | `VARCHAR(32) CHARACTER SET ascii COLLATE ascii_bin` | `TEXT` |
| JSON documents | `TEXT` | `LONGTEXT` | `TEXT` |
| Booleans | `SMALLINT` | `TINYINT` | `INTEGER` |
| Audit trail id | `BIGINT GENERATED ALWAYS AS IDENTITY` | `BIGINT AUTO_INCREMENT` | `INTEGER PRIMARY KEY AUTOINCREMENT` |
| Node upsert | `INSERT … ON CONFLICT (identifier) DO UPDATE` | `INSERT … ON DUPLICATE KEY UPDATE` with `VALUES(col)` | as PostgreSQL |

On MariaDB and MySQL the entity ID is binary because a `utf8mb4` column of that length does not fit an index and its default collation ignores case.

#### `console_schema_version`

One row per applied migration: its number and when it was applied. The primary key on the number is what settles two concurrent migration runs.

#### `console_entity`

One row per managed entity, of any set.

| Column | Meaning |
| --- | --- |
| `entity_set` | `saml20-sp-remote`, `saml20-idp-remote` or `saml20-idp-hosted` |
| `entity_id` | The entity ID |
| `enabled` | Whether the entity travels in the next Snapshot |
| `document` | The Console document, as JSON |
| `version` | Optimistic-locking counter (section 4.8) |
| `external_fingerprint` | For an Override, the fingerprint of the External entity it was last compared with (section 9); otherwise null. Updating it does not change `version`. |
| `created_at`, `updated_at` | Timestamps |

Deleting a managed entity deletes its row. There is no per-row publication state: the state of an object is computed against the current Snapshot (section 8).

#### `console_authsource`

One row per managed authsource.

| Column | Meaning |
| --- | --- |
| `id` | The authsource id |
| `type` | The Authsource type, such as `ldap:Ldap` |
| `enabled`, `document`, `version`, `created_at`, `updated_at` | As for entities |

#### `console_snapshot`

One row per retained Snapshot.

| Column | Meaning |
| --- | --- |
| `number` | The Snapshot's number. Numbers grow by one and are never reused, not even after a purge. |
| `format_version` | Version of the layout of `document`. A node whose code knows only a lower one does not use the Snapshot. |
| `checksum` | Checksum of `document`, verified by nodes and before a Rollback |
| `document` | The whole Snapshot as one JSON document: every enabled managed entity and managed authsource as Console documents, with Secret references unresolved and literal secrets in clear |
| `comment` | The optional comment given at Publication |
| `created_at` | When it was published |
| `created_by` | The identity that published it |

A row is never updated. Rows are deleted only by the purge of section 4.10.

OPEN: the layout of the Snapshot `document` (its top-level keys and how entities and authsources are keyed inside it), the checksum algorithm and what exactly it covers, and the value of `format_version` in v1 are not decided.

#### `console_pointer`

Exactly one row, with `id = 1` enforced by a `CHECK` constraint and inserted by a migration.

| Column | Meaning |
| --- | --- |
| `current_number` | The Snapshot nodes must serve; null until the first Publication |
| `last_number` | The highest number ever given to a Snapshot; 0 until the first Publication |

#### `console_node`

One row per node that has checked recently.

| Column | Meaning |
| --- | --- |
| `identifier` | The node's identifier (section 2.3) |
| `served_number` | The Snapshot the node serves, or null when it serves none |
| `checked_at` | Its last check |
| `has_problems` | Whether the node has anything to report on its own status screen |

The Console highlights a node whose `served_number` is not the current one, whose `checked_at` is older than 5 minutes, or whose flag is set. There are no named node states.

#### `console_audit`

The Audit trail: one row per change of state made in the Console that took effect.

| Column | Meaning |
| --- | --- |
| `id` | Auto-increment. The order of the Audit trail is the order of `id`, never of `at`. |
| `at` | When |
| `identity` | Who, as text copied at the time (section 2.3). There is no user table and no IP address. |
| `action` | `create`, `edit`, `delete`, `enable`, `disable`, `discard`, `import`, `reviewed`, `publish`, `rollback` or `migrate` |
| `object_type` | `entity`, `authsource`, or null for `publish`, `rollback` and `migrate` |
| `entity_set`, `entity_id` | The managed entity, when `object_type` is `entity` |
| `authsource_id` | The managed authsource, when `object_type` is `authsource` |
| `document` | The full Console document as it stood after the change, with every sensitive value replaced by a marker that says only whether it changed. A Secret reference is stored as is. Null for `publish`, `rollback` and `migrate`. |
| `snapshot_from`, `snapshot_to` | For `publish` and `rollback`, the current number before and after |
| `comment` | For `publish`, the Snapshot's comment, copied so that it survives the purge |
| `schema_version` | For `migrate`, the schema version after the run |

Two indexes serve the history of one object: (`entity_set`, `entity_id`) and (`authsource_id`). Because objects are matched by their natural key, an entity deleted and created again under the same entity ID and set continues one history.

Rules:

- A row is written in the same transaction as the change it records. The one exception is `migrate`: a migration run leaves a single row, written after the run, because DDL cannot share a transaction with it on MariaDB and MySQL and the first run creates this table.
- An Import leaves one `import` row per entity created. A Publication or a Rollback leaves a single row with the Snapshot numbers and no copy of the content.
- Not recorded: reads, logins, node activity, and operations that failed or were rejected, such as a save with errors, a Publication refused by validation or a request without a valid token.
- The value of a sensitive option is never stored in this table.
- The table is append-only by code: its repository exposes no update and no delete. There are no triggers and no database permissions behind that. v1 never purges it, and a row survives the deletion of its object and the purge of its Snapshot.

### 4.5 Stable contracts

`console_snapshot`, `console_node` and `console_pointer` are read or written by nodes, which may run older or newer code than the Console during a rolling upgrade. They are stable contracts:

- A migration may only add columns to them, nullable or with a default. It never drops, renames, retypes or repurposes one.
- An incompatible change is expressed by raising the Snapshot's format version, never by altering these tables.

The other tables are used by the edit side only, which requires the schema to match its code exactly (section 4.7).

### 4.6 Migrations

- A migration is a numbered PHP class holding hand-written SQL for each engine. Numbers are sequential integers from 1 and mean the same on every engine.
- Every migration holds exactly one statement, DDL or DML, on every engine. DDL commits implicitly on MariaDB and MySQL, so this is what makes a migration either applied or not.
- Migrations are forward-only. There is no `down`.
- The runner creates `console_schema_version` itself with `CREATE TABLE IF NOT EXISTS` before anything else.
- On PostgreSQL and SQLite a migration and its version row share a transaction. On MariaDB and MySQL the statement runs first and the version row is written second.
- Two concurrent runs are settled by the primary key of `console_schema_version` or, on MariaDB and MySQL, by the statement itself failing for the loser. The loser gets a clear message. No advisory locks are used.
- Migrations are applied only when the administrator presses the button on the pending migrations page. They are never applied lazily by a request, nor by a node on its own.
- A run is recorded in the Audit trail as described in section 4.4.

v1 ships nine migrations:

| Number | Statement |
| --- | --- |
| 1 | Create `console_entity` |
| 2 | Create `console_authsource` |
| 3 | Create `console_snapshot` |
| 4 | Create `console_pointer` |
| 5 | Insert the single row of `console_pointer` |
| 6 | Create `console_node` |
| 7 | Create `console_audit` |
| 8 | Create the index `console_audit_entity` |
| 9 | Create the index `console_audit_authsource` |

A later migration may transform stored documents only mechanically. A document that a tightened schema no longer accepts is left as it is and blocks Publication until it is fixed or disabled (section 8).

### 4.7 Database states

The schema matches the code when the numbers in `console_schema_version` are exactly 1 to N, for the N the code knows.

Before doing anything else, every Console route establishes which of these states the database is in. Only the first lets the request proceed; each of the others has a page of its own and is an ordinary state, not an exception.

| State | Page |
| --- | --- |
| Schema matches the code | The requested screen |
| Database unreachable | "Database unreachable" |
| SQLite older than 3.24.0 | "SQLite too old" |
| Versions table missing, as on a fresh install | Pending migrations |
| Applied numbers are not exactly 1 to N | Pending migrations |

The pending migrations page takes the whole content area, warns that a migration cannot be undone without restoring a backup, and carries the button that runs the migrations.

None of these states affects SSO, which reads only the local Snapshot.

### 4.8 Concurrency

No advisory locks and no global edit counter are used. Races are settled by conditions on `UPDATE` statements and by primary keys.

**Saving an object.** The edit form carries the `version` it was loaded with. The save is `UPDATE … SET version = version + 1 … WHERE version = ?`. Zero rows means the object changed or was deleted meanwhile, and the save is rejected. Every change that can become a Pending change increments `version`, enabling and disabling included. Creating an object that already exists fails on the primary key.

**Publication.** One transaction:

1. It runs at `REPEATABLE READ`, set with `SET TRANSACTION ISOLATION LEVEL`, because entities and authsources are read in separate queries and must describe one instant. On SQLite it opens with `BEGIN IMMEDIATE` and a 5 second `busy_timeout` instead, so the loser of a race waits and then fails at step 2 or 3.
2. It recomputes a hash of the Pending changes, made of their keys and `version` values, and compares it with the hash the confirmation screen carried. A mismatch shows the confirmation screen again.
3. It takes the next number with `UPDATE console_pointer SET last_number = ?, current_number = ? WHERE last_number = ?`, the new values being the old `last_number` plus one.
4. It inserts the Snapshot row and the `publish` row of the Audit trail.

**Rollback.** `UPDATE console_pointer SET current_number = ? WHERE current_number = ?`, the condition being the number the confirmation screen showed, together with the `rollback` row of the Audit trail. Zero rows shows the confirmation screen again.

**One conflict error.** A lost race does not look the same on every engine. The persistence layer turns all of its shapes into a single conflict error, for every write the Console makes and not only for a Publication:

| Shape | Where |
| --- | --- |
| Zero rows updated | MariaDB 10.11, MySQL, SQLite |
| Primary-key clash on the Snapshot | Any engine |
| SQLSTATE `40001` | PostgreSQL serialization failure; deadlock on MariaDB and MySQL |
| SQLSTATE `40P01` | PostgreSQL deadlock |
| Driver error code 1020, reported under SQLSTATE `HY000` | MariaDB 11.6.2 and later |
| `SQLITE_BUSY` after the `busy_timeout` | SQLite |

For the administrator the outcome is always the same: the form or the confirmation screen is shown again with the current state. Nothing is retried automatically.

### 4.9 Snapshot size

A Snapshot is one row, so on MariaDB and MySQL its size is bounded by `max_allowed_packet`.

Before inserting the Snapshot on those engines, a Publication reads `@@max_allowed_packet` and is blocked, with a message naming the variable, when the document is larger than that value minus 1 MiB. With the engines' defaults this allows 15 MiB on MariaDB and 63 MiB on MySQL.

The Console sets no limit of its own, applies none on PostgreSQL or SQLite, and gives no warning when a Snapshot approaches the limit.

### 4.10 Retention

- **Snapshots.** The database keeps the configured number of Snapshots, 10 by default. A Publication purges the oldest beyond that number. The current Snapshot is never purged, whatever its age. A Rollback can only target a retained Snapshot. Snapshots are not all kept because they hold literal secrets in clear, and a rotated secret would otherwise stay in the database for ever.
- **Nodes.** A node that has not checked for the forgetting interval, one hour by default, is dropped from the node list and its row deleted. No manual action exists or is needed.
- **Audit trail.** Never purged in v1.

## 5. Managed entities

_Not written yet._

## 6. Managed authsources

### 6.1 What a managed authsource is

A managed authsource is one row of `console_authsource` (section 4.4): an id, an Authsource type, an enabled flag and a Console document holding its options. The id, the type and the flag are not part of the document.

**Id.**

- It matches `[A-Za-z0-9_.-]+`, is at most 255 bytes long and is compared byte for byte.
- `admin` is reserved for the file and is rejected, so a broken Snapshot can never lock the administrator out.
- An id that PHP would turn into an integer array key is rejected: a decimal integer without leading zeros, with or without a minus sign.
- It cannot be changed once the authsource exists. Renaming is duplicating and deleting.
- Two managed authsources cannot share an id. A managed authsource may share its id with a File authsource; it is then Shadowed (section 6.4).

**Type.** One of the five Authsource types of section 6.5, chosen when the authsource is created. It cannot be changed afterwards, because the document is only valid against the schema of its type.

**Enabled flag.** A disabled managed authsource does not travel in the Snapshot. Enabling and disabling are Pending changes like any other and have no effect before the next Publication (section 8).

An authentication source of any other type, or one that needs an option its schema does not catalog, stays a File authsource. See [ADR 0006](docs/adr/0006-closed-catalog-of-authsource-types.md).

### 6.2 How a managed authsource reaches core

SimpleSAMLphp 2.5 has no extension point for resolving authsource ids: every reader goes through `Configuration::getConfig('authsources.php')`. Managed authsources are merged into the result of that file by the fragment of section 2.6, which calls `\SimpleSAML\Module\console\Authsources::merge()`. See [ADR 0005](docs/adr/0005-managed-authsources-through-a-hand-added-fragment.md).

`merge()` takes the array of File authsources and returns it with the managed ones added.

- It returns the array untouched when the module `console` is not enabled on the node.
- It reads `authsources.php` from the build the node is serving (section 3.5). That file is a `return` of an array keyed by id, each entry already translated into what core expects, with Secret references resolved.
- It merges with `+`, so a File authsource always wins over a managed authsource with the same id.
- It catches every `\Throwable` and leaks no variables into the scope of `authsources.php`.
- When the node has no local Snapshot, or the file of the build is missing or unreadable, it returns the File authsources alone and logs a warning.
- Inside a readable file it checks each entry again and drops, with a warning, only those that are invalid: an entry that is not an array, one without a string at key `0`, one whose id is an integer.
- It records that it ran in the current request. That is how the node detects a missing fragment (section 3.5).

Core caches the result of `authsources.php` for the current request only, so a new build is seen by the next request.

### 6.3 File authsources in the Console

The Console lists the File authsources of the node it runs on, read-only, under the managed ones.

- It shows their id and their type and nothing else. Without a schema the Console cannot tell which of their options are sensitive, so it never shows their options.
- It learns them from the array the fragment passes to `merge()`. On a node without the fragment, every authsource core returns is a File authsource.
- An entry that is a PHP reference to another entry of the file is listed as a File authsource of its own.
- A File authsource whose id is also a managed authsource is marked as the one that shadows it.
- The Console sees only the `authsources.php` of its own node. Keeping File authsources identical across nodes is the deployment's job (section 2.8).

A File authsource cannot be copied into the Console from this list. Its PHP can be pasted into "Add authsource" when its type is one of the five (section 6.16).

### 6.4 Collision and precedence

What a node serves for an id depends on the node's own `authsources.php` and on the build it is serving. The table is per node. "Managed authsource" means what the current Snapshot holds, not what is saved: a managed authsource that was never published counts as "None".

| File authsource with that id on the node | Managed authsource | The node serves | What the administrator sees |
| --- | --- | --- | --- |
| Yes | None | The File authsource | Listed read-only, id and type |
| No | Enabled | The managed authsource | Editable |
| Yes | Enabled | The File authsource | The managed one is Shadowed: a warning on the authsource list and on the Publication screen, and a problem on that node's status. Publication is not blocked. |
| No | Disabled | Nothing | Editable; not in the Snapshot |
| Yes | Disabled | The File authsource | Editable; not in the Snapshot |
| No | Enabled, but left out of this node's build or dropped by `merge()` | Nothing, on this node only | The node's row is flagged; the reason is on that node's status screen |
| Yes | Enabled, but left out of this node's build or dropped by `merge()` | The File authsource | As above |
| Any | Any, and the node has no local Snapshot or the build's `authsources.php` is unreadable | The File authsources only; a warning is logged | Nothing in the Console; the node's log |
| Any | Any, and the fragment is missing or the module is not enabled on the node | The File authsources only | A problem on that node's status when the current Snapshot holds managed authsources |

A managed authsource is left out of a node's build when a Secret reference in it does not resolve on that node, when its current key or certificate fails the node's check, or when the node's code cannot translate its document (sections 3.5 and 7).

A Shadowed managed authsource still travels in the Snapshot. The Console judges Shadowed against the file of the node serving the page; every node settles the collision against its own file.

### 6.5 The catalog

v1 ships five Authsource types. The catalog is closed: there is no generic type, and neither a deployment nor another module can add to it.

| Authsource type | SimpleSAMLphp module | Schema | Example document and array |
| --- | --- | --- | --- |
| `saml:SP` | `saml`, in core | [`saml/SP.json`](docs/spec/schemas/authsources/saml/SP.json) | [`SP.json`](docs/spec/examples/authsources/saml/SP.json), [`SP.php`](docs/spec/examples/authsources/saml/SP.php) |
| `ldap:Ldap` | `ldap`, package `simplesamlphp/simplesamlphp-module-ldap`, 2.5 line | [`ldap/Ldap.json`](docs/spec/schemas/authsources/ldap/Ldap.json) | [`Ldap.json`](docs/spec/examples/authsources/ldap/Ldap.json), [`Ldap.php`](docs/spec/examples/authsources/ldap/Ldap.php) |
| `sqlauth:SQL2` | `sqlauth`, package `simplesamlphp/simplesamlphp-module-sqlauth`, 1.4 line | [`sqlauth/SQL2.json`](docs/spec/schemas/authsources/sqlauth/SQL2.json) | [`SQL2.json`](docs/spec/examples/authsources/sqlauth/SQL2.json), [`SQL2.php`](docs/spec/examples/authsources/sqlauth/SQL2.php) |
| `multiauth:MultiAuth` | `multiauth`, in core | [`multiauth/MultiAuth.json`](docs/spec/schemas/authsources/multiauth/MultiAuth.json) | [`MultiAuth.json`](docs/spec/examples/authsources/multiauth/MultiAuth.json), [`MultiAuth.php`](docs/spec/examples/authsources/multiauth/MultiAuth.php) |
| `exampleauth:UserPass` | `exampleauth`, in core | [`exampleauth/UserPass.json`](docs/spec/schemas/authsources/exampleauth/UserPass.json) | [`UserPass.json`](docs/spec/examples/authsources/exampleauth/UserPass.json), [`UserPass.php`](docs/spec/examples/authsources/exampleauth/UserPass.php) |

Schema paths are relative to `docs/spec/schemas/authsources/`, as `<module>/<Class>.json`. Two more files hold shapes that several schemas pull in with `$ref`:

- [`core/UserPassBase.json`](docs/spec/schemas/authsources/core/UserPassBase.json): the options core's `UserPassBase` gives every username and password authsource. It is not an Authsource type.
- [`common.json`](docs/spec/schemas/common.json), one level up: shapes shared with the entity schemas of section 5.

The type strings are exact. `ldap:LDAP` is not a type, `sqlauth:SQL` is a deprecated wrapper the Console does not offer, and `userpass:Database` does not exist.

Each example is one valid document next to the PHP array core receives for it, type at key `0` included.

Each Authsource type has, besides its schema, a PHP class under a parallel name that holds its cross-field rules, its translator and its inverse translator (section 3.3).

### 6.6 Schema conventions

Every schema is JSON Schema 2020-12 and describes the Console document, not the array core expects.

- **Closed.** The root and every nested object carry `additionalProperties: false`. An option the schema does not catalog is rejected on save. The one exception is the configuration of a processing filter (section 6.7).
- **Names.** A root option keeps the name core gives it, dots and colons included (`sign.logout`, `core:loginpage_links`), unless section 6.11 to 6.15 says the type remodels it.
- **Labels and help.** `title` and `description`. Help text states the fallback the SimpleSAMLphp code applies when the option is not set.
- **`default` and `examples`.** Shown as a hint only. Validation never writes a `default` into a document, and a required option that has a default is still required. An option that is not set gets its value from the SimpleSAMLphp module on the node.
- **Order.** The declaration order of `properties` is the order of the form and of the keys in the PHP text.
- **`$ref`.** Only to files of the catalog, resolved in PHP before the form is built.
- **Messages.** Every `pattern` carries its own message in `$error`.

The annotations the Console adds:

| Annotation | On | Meaning |
| --- | --- | --- |
| `x-sensitive: true` | A string | A sensitive value (section 6.8) |
| `x-key-reference` | `private-key` on a string, `certificate` on a certificate object | The value is a Key reference (section 7) |
| `x-authsource-reference: true` | A string | The value is the id of another authsource. Publication checks it without knowing the type (section 6.9), and the form renders it as a select built on the server. |
| `x-groups` | The root | A list of `{title, properties}`. Every root option belongs to exactly one group. |
| `x-widget` | Any property | `radio` or `textarea`; otherwise the widget follows from the type. On a value that is not a string, `textarea` means the value is edited as JSON text. |
| `x-when` | A property | Names a sibling and the values of it for which the property applies. A property that does not apply is hidden and dropped on save. |

`if`/`then`/`else` keeps expressing what is required; `x-when` expresses what applies. Every property a branch requires carries a compatible `x-when`. How the form uses these annotations is specified in section 10; see [ADR 0007](docs/adr/0007-authsource-forms-rendered-by-twig-from-the-schema.md).

### 6.7 Shared shapes

Defined in `common.json` unless stated otherwise.

**List of strings** (`stringList`). An option core accepts as a string or as a list is always a list in the document.

**Language map** (`languageMap`). A localized string is always an object of language code to text, with at least one entry. `languageListMap` maps a language code to a list of strings.

**Processing filters** (`authproc`). A list of rows `{priority, filter}`:

- `priority` is an integer and no two rows share it;
- `filter` is an object with a mandatory string `class`; the rest of it is free-form and is neither validated nor masked;
- a positional element of the filter's configuration is a member whose name is its index, as in `{"class": "core:AttributeMap", "0": "oid2name"}`.

The translator turns the rows into core's map of priority to filter array.

**Key slot** (`keySlot`) and **certificate** (`certificate`). A key slot groups one private key with its certificate:

| Field | Meaning | Emitted as |
| --- | --- | --- |
| `privatekey` | Key reference to the private key file: a name relative to the node's `certdir`, an absolute path, or `%env(CONSOLE_NAME)%` resolving to one | `privatekey` |
| `privatekey_pass` | Its passphrase; sensitive | `privatekey_pass` |
| `certificate` with `source: pasted` | The certificate itself in `pem`, held by the Console | `certData`: the base64 body, without armour or line breaks |
| `certificate` with `source: file` | A file reference in `file`, in the same forms as `privatekey` | `certificate` |
| `key_name` | The name published with the certificate | `key_name` |

A slot emits exactly one certificate form. In a next-key slot every emitted name takes the prefix `new_`. On save the Console rewrites a pasted certificate as PEM with armour and 64-character lines, so that the document is the same after a round trip through the PHP text. The rules for Key references, the next key and Promote are in section 7.

OPEN: whether a key slot may hold a private key without a certificate or a certificate without a private key. The schema accepts either; core does too.

**Contacts, `EntityAttributes`, `UIInfo` and `RegistrationInfo`.** Closed shapes, the same wherever they are cataloged:

- a contact has a mandatory `contactType` (`technical`, `support`, `administrative`, `billing` or `other`), optional `givenName`, `surName` and `company`, lists `emailAddress` and `telephoneNumber`, and `attributes` as rows `{name, value}`;
- `EntityAttributes` is a list of rows `{name, values}`;
- `UIInfo` holds language maps `DisplayName`, `Description`, `InformationURL` and `PrivacyStatementURL`, a `Keywords` map of language to list, and `Logo` as a list of `{url, width, height, lang?}`;
- `RegistrationInfo` holds `authority`, an optional `instant` and optional `policies` as a language map.

Rows keyed by `name` are translated to core's maps; a repeated name is rejected on save.

**`UserPassBase` options** (`core/UserPassBase.json`). `ldap:Ldap`, `sqlauth:SQL2` and `exampleauth:UserPass` each catalog three more root options, in a last group "Login page", emitted as they are:

| Option | Shape |
| --- | --- |
| `core:loginpage_links` | List of `{href, text}` |
| `remember.username.enabled` | Boolean |
| `remember.username.checked` | Boolean |

### 6.8 Validation on save

A managed authsource is saved only when it is valid on its own. There are no invalid drafts.

1. The id rules of section 6.1, when the authsource is created.
2. The schema of the type, with `opis/json-schema` reporting every error (section 3.7).
3. The cross-field rules of the type's class (sections 6.11 to 6.15) and the rules below that no schema expresses.

Errors of all three are reported together, each by the JSON pointer of the value it concerns. The Console never instantiates the authsource class to validate.

**Rules that apply to every type**

- A processing filter whose `class` names core's `core:PHP` filter, in the short form or as the full class name, is rejected: that filter carries code.
- Two processing filters with the same priority are rejected.
- In a private key or certificate file reference, a `pdo://` location and a `%secret(name)%` reference are rejected. A pasted certificate that cannot be parsed is rejected.

**Secret references.** A string value may be a Secret reference instead of a literal (section 7), under these rules:

- only in a string that has no `enum`, and the reference fills the whole value;
- `pattern` and `format` are not applied to it;
- an integer or a boolean cannot be a Secret reference, so it cannot vary per node;
- inside the free-form configuration of a processing filter, any string may be one.

OPEN: which string options of a managed authsource refuse a Secret reference although they have no `enum`. Candidates are the values the Console itself compares: an `x-authsource-reference`, the `preselect` of `multiauth:MultiAuth`, the names that link the lists of `sqlauth:SQL2`, the `username` of `exampleauth:UserPass` and the `entityID` of `saml:SP`. No annotation marks such an option yet.

**Sensitive values.** The options annotated `x-sensitive` are:

| Authsource type | Sensitive options |
| --- | --- |
| `saml:SP` | `privatekey_pass` of `key` and of `next_key` |
| `ldap:Ldap` | `search.password`, `priv.password` |
| `sqlauth:SQL2` | `password` of each database |
| `multiauth:MultiAuth` | none |
| `exampleauth:UserPass` | `password` of each user |

A stored literal of a sensitive option is sent only to the edit form of its own authsource; everywhere else it is a marker (sections 7 and 10). The configuration of a processing filter is free-form, so a literal secret inside it is shown unmasked; the Console recommends a Secret reference there. The `contacts` of `saml:SP` hold personal data and are not masked.

**Warnings on save.** They never block.

- Saving an `exampleauth:UserPass`: it is not meant for production.
- A processing filter whose `class` does not resolve on the node serving the Console.
- A Secret reference that does not resolve on the node serving the Console.
- A key or certificate file missing on that node, a private key that does not match its certificate there, an expired certificate (section 7).

### 6.9 Checks at Publication

A Publication validates every enabled managed authsource again and adds the checks that span objects. Each block names the object.

**Blocks**

- Anything that would block a save, judged against the schemas and rules of the code that publishes. A module update that tightens a schema can therefore block Publication until the stored document is fixed or the authsource disabled; the current Snapshot keeps being served.
- A type whose SimpleSAMLphp module is not installed and enabled on the publishing node.
- An `x-authsource-reference` whose value is neither the id of an enabled managed authsource nor the id of a File authsource of the publishing node. In v1 the only such option is `source` in `multiauth:MultiAuth`; the `auth` of a managed `saml20-idp-hosted` is checked the same way (section 5). Deleting or disabling a managed authsource that is referenced can be saved, and it is the Publication that blocks.
- A processing filter whose `class` does not resolve on the publishing node.

**Warnings, never blocking**

- A managed authsource Shadowed by a File authsource of the publishing node.
- A reference satisfied only by a File authsource: that File authsource has to exist on every node.

Nothing else is checked. In particular the Console does not check that the `idp` of a `saml:SP` exists as an entity, nor that `multiauth:MultiAuth` sources do not refer back to their own authsource.

### 6.10 Translation on the node

The Snapshot carries each enabled managed authsource as `{id, type, document}`, with Secret references unresolved (section 4.4). A node that builds its local copy takes each one through these steps, in this order:

1. resolve every Secret reference;
2. check every Key reference (section 7);
3. translate the document with the class of its type;
4. write the result, keyed by id, into the build's `authsources.php`.

Translating at Publication is not possible: a Secret reference fills a whole value, and translation can move a value into an array key, as in `exampleauth:UserPass`.

Every translator follows the same general rules; sections 6.11 to 6.15 list only what departs from them.

- The type goes at key `0` of the array.
- A root option that is not remodelled is emitted under its own name with its value as it is: a list as a PHP list, a language map as an array keyed by language.
- An option that is not set is not emitted. The translator adds no defaults.
- Options are emitted in schema order.

A node whose code cannot translate a document, because its module version differs from the Console's, leaves that authsource out of its build and flags itself (section 3.5).

The test suite checks, for every schema, that a valid fixture translates into an array the real authsource class accepts, and that document to PHP to document is the identity (section 12).

### 6.11 `saml:SP`

The schema catalogs 51 root options in seven groups. `entityID` is the only required one.

| Group | Options |
| --- | --- |
| Identity and IdP selection | `entityID`, `idp`, `discoURL`, `RelayState`, `enable_unsolicited`, `RequestInitiation`, `proxymode.passAuthnContextClassRef` |
| Authentication request | `ForceAuthn`, `IsPassive`, `ProtocolBinding`, `AssertionConsumerServiceIndex`, `AttributeConsumingServiceIndex`, `AuthnContextClassRef`, `AuthnContextComparison`, `NameIDPolicy`, `IDPList`, `ProxyCount`, `disable_scoping`, `ProviderName` |
| Signing and encryption | `sign.authnrequest`, `sign.logout`, `redirect.sign`, `validate.logout`, `redirect.validate`, `signature.algorithm`, `WantAssertionsSigned`, `assertion.encryption`, `nameid.encryption`, `encryption.blacklisted-algorithms`, `saml20.hok.assertion` |
| Keys | `key`, `next_key` |
| Endpoints | `AssertionConsumerService`, `acs.Bindings`, `SingleLogoutServiceBinding`, `SingleLogoutServiceLocation` |
| Published metadata | `name`, `description`, `attributes`, `attributes.required`, `attributes.NameFormat`, `attributes.index`, `attributes.isDefault`, `OrganizationName`, `OrganizationDisplayName`, `OrganizationURL`, `contacts`, `EntityAttributes`, `UIInfo`, `RegistrationInfo` |
| Processing | `authproc` |

**Remodelled options**

| In the document | Core receives |
| --- | --- |
| `key`, a key slot | `privatekey`, `privatekey_pass`, `key_name`, and `certData` or `certificate` |
| `next_key`, a key slot | The same names with the prefix `new_` |
| `AuthnContextClassRef`, always a list | The list |
| `name`, `description`, `OrganizationName`, `OrganizationDisplayName`, `OrganizationURL`, always language maps | The map |
| `NameIDPolicy`, an object with optional `Format`, `AllowCreate` and `SPNameQualifier` | The array; an object with no fields becomes `[]`, which makes core omit the element |
| `attributes`, rows `{name, friendlyName?}` | A row with a friendly name becomes `friendlyName => name`; one without is positional |
| `contacts`, `EntityAttributes` | As in section 6.7 |
| `AssertionConsumerService`, a list of `{Binding, Location, index?, isDefault?}` | The list |
| `authproc` | As in section 6.7 |

`privatekey`, `certificate`, `certData`, `keys`, `key_name` and their `new_` forms are never options of their own.

**Rules.** The first two are in the schema, the rest in the class.

- `entityID` is at most 1024 characters and is not core's placeholder `https://myapp.example.org/`.
- `signature.algorithm` is one of the four RSA algorithms of the schema's enum.
- `OrganizationName` without `OrganizationURL` is rejected; core throws on it.
- No two rows of `attributes` share a `name` or a `friendlyName`.
- In `AssertionConsumerService`, no two endpoints share an `index` and at most one is `isDefault`.

**Left out.** `saml:Extensions` and `saml:logout:Extensions`, which are XML objects and not expressible in JSON; every `saml.SOAPClient.*` option; `NameIDFormat`, which the code does not read.

OPEN: which `Binding` values an `AssertionConsumerService` endpoint of a `saml:SP` accepts, and whether the endpoint may carry `ResponseLocation` or `hoksso:ProtocolBinding`. The schema accepts any non-empty `Binding` and neither of the two fields.

### 6.12 `ldap:Ldap`

Root options: `connection_string`, `encryption`, `version`, `timeout`, `connector`, `debug`, `options`, `search`, `attributes`, `priv`, and the three `UserPassBase` options. `connection_string`, `search` and `attributes` are required.

**Remodelled options**

| In the document | Core receives |
| --- | --- |
| `search`, an object with `enable`, `base`, `dnpattern`, `attributes`, `filter`, `scope`, `username` and `password` | `search.enable`, `search.base`, `dnpattern`, `search.attributes`, `search.filter`, `search.scope`, `search.username`, `search.password` |
| `priv`, an object with `username` and `password` | `priv.username`, `priv.password` |
| `attributes` with `mode: none` | No `attributes` key: the user gets no attributes |
| `attributes` with `mode: all` | `attributes => null`: every attribute of the entry |
| `attributes` with `mode: list` | `attributes` with the names in `list` |
| `binary` inside `attributes` | `attributes.binary` |
| `connector`, one of the two class names the module ships | The class name |
| `options`, an object with only `network_timeout` and `referrals` | The array |

**Rules, all in the schema**

- `connection_string` is one or more `ldap://` or `ldaps://` URIs separated by a space.
- `search.enable` and `search.base` are always required; the module reads `search.base` even when the DN is built from a pattern.
- With `search.enable` on, `search.attributes` is required; `dnpattern` does not apply. With it off, `dnpattern` is required and must contain `%username%`; `attributes`, `filter`, `scope`, `username` and `password` of `search` do not apply.
- `list` is required when `mode` is `list` and applies only then; `binary` applies when `mode` is `all` or `list`.
- `search.username` cannot be only spaces.

**Left out.** `extension`, and any member of `options` other than the two listed.

### 6.13 `sqlauth:SQL2`

Root options: `databases`, `auth_queries`, `attr_queries`, and the three `UserPassBase` options. `databases` and `auth_queries` are required and hold at least one row.

**Remodelled options**

| In the document | Core receives |
| --- | --- |
| `databases`, an ordered list of `{name, dsn, username, password}` | A map of `name` to `{dsn, username, password}`, in the same order |
| `auth_queries`, an ordered list of `{name, database, query, username_regex?, extract_userid_from?, password_verify_hash_column?}` | A map of `name` to the rest, in the same order; the module tries them in that order |
| `attr_queries`, a list of `{database, query, only_for_auth?}` | The list |

**Rules.** The first is in the schema, the rest in the class.

- A `name` starts with a letter or an underscore and holds only letters, digits, underscores and hyphens.
- No two databases share a name, and no two authentication queries do.
- The `database` of every query is the name of one of the databases.
- Every entry of `only_for_auth` is the name of one of the authentication queries.
- A `dsn` that contains `password=`, in any letter case, is rejected. `dsn` is not a sensitive option; the password goes in `password`.

In the form, `database` and `only_for_auth` are plain text fields checked on save, not selects.

**Left out.** The PDO driver `options` of a database.

### 6.14 `multiauth:MultiAuth`

Root options: `sources`, required with at least one row, and `preselect`.

**Remodelled options**

| In the document | Core receives |
| --- | --- |
| `sources`, an ordered list of `{source, text?, help?, css_class?, AuthnContextClassRef?}` | A map of `source` to the rest, in the same order; a row with only `source` becomes `source => []` |
| `text`, `help`, always language maps | The map |
| `AuthnContextClassRef`, always a list | The list |

`source` carries `x-authsource-reference`.

**Rules,** both in the class.

- No two rows share a `source`.
- `preselect` is the `source` of one of the rows.

### 6.15 `exampleauth:UserPass`

Root options: `users`, required with at least one row, and the three `UserPassBase` options.

**Remodelled options**

| In the document | Core receives |
| --- | --- |
| `users`, a list of `{username, password, attributes?}` | A map whose keys are `username:password` |
| `attributes` of a user, rows `{name, values}` | A map of name to list of values; a user without attributes gets `[]` |

**Rules.** The first is in the schema, the second in the class.

- A `username` is not empty and contains no colon. A `password` may contain one.
- No two users share a `username`, and no two attributes of a user share a `name`.

The password ends up inside an array key, which is why this type is translated after Secret references are resolved.

### 6.16 PHP text

The edit screen shows a managed authsource either as a form or as the PHP an administrator would write in `authsources.php`: `'id' => [...],` with the type at key `0`. The text is produced by the translator with Secret references unresolved and is never stored. Reading it back, and reading PHP pasted into "Add authsource", is the work of the inverse translator of the type. The editor, its sentinel for sensitive values and its errors are specified in section 10; see [ADR 0010](docs/adr/0010-php-view-through-inverse-translators.md).

What is specific to authsources:

- A key the type does not catalog is an error naming the key. It is never kept aside: authsource schemas have no `extra` bag. That includes every option listed as left out in sections 6.11 to 6.15.
- A block whose id or whose type differs from the authsource being edited is rejected. In "Add authsource" the type is read from key `0`, and a type outside the five stops there.
- The inverse translator accepts each form core accepts for a cataloged option and returns the single form of the document: a string where core takes a string or a list becomes a list of one; a plain localized string becomes a language map with the language `en`, which is how core reads it; `search.*` and `priv.*` keys are gathered into their objects; an absent `attributes` of `ldap:Ldap` becomes `mode: none` and a `null` one `mode: all`.
- `certData` becomes a pasted certificate, and a `certificate` location a file reference.
- In `exampleauth:UserPass` the password sits in the key, so the sentinel of a stored password is part of the key and renaming the user in the text means retyping the password.

OPEN: how the inverse translator of `saml:SP` reads `keys` and `new_keys`, which core accepts in place of `certData` and `certificate` and the Console never emits.

### 6.17 Accepted gaps

- No client certificate for Artifact resolution or SOAP logout: `saml.SOAPClient.*` is not cataloged.
- No PDO driver options for `sqlauth:SQL2`, so a custom CA towards the database needs a File authsource.
- No `saml:Extensions` on the requests of a `saml:SP`.
- The Console checks references and modules against the publishing node only. Keeping File authsources and modules identical across nodes is the deployment's job (section 2.8).

## 7. Keys and secrets

_Not written yet._

## 8. Workflow

_Not written yet._

## 9. External entities, Override and Import

_Not written yet._

## 10. Console UI

_Not written yet._

## 11. Failure behaviour

_Not written yet._

## 12. Test harness and local environment

_Not written yet._

## 13. GitHub Actions

_Not written yet._

## 14. Repository security policy

_Not written yet._
