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
| Browser | A current browser that runs ES modules, as targeted by Vite's default build. JavaScript is required; there is no fallback without it. |
| Language | English only. The Console has no translations and no language selector. |

The module is the maintainer's own package. It follows the conventions of official SimpleSAMLphp modules for packaging, routing and controllers, except that its interface is a single-page application served by a shell of its own (section 10). Adoption by the SimpleSAMLphp project is not a goal.

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
- **Command-line tools and a JSON status endpoint.** The Console's API (section 10.4) serves its own interface only; it is not a public or status API.
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
- GitHub disables the weekly workflow after 60 days without activity in the repository (section 13.3).

## 2. Installation and configuration

### 2.1 Package

The module is the Composer package `sgomez/simplesamlphp-module-console` and installs as the SimpleSAMLphp module `console`. Its production dependencies beyond SimpleSAMLphp 2.5 are listed in section 3.7.

The package ships the built front end under `public/assets/app/`, with Vite's manifest, and the JSON Schemas under `docs/spec/schemas/`. The front-end sources with their stories and reference screenshots, the Storybook configuration, `package.json`, `package-lock.json` and the Node tooling are `export-ignore`. Installing the module needs no Node.

### 2.2 Installation steps

Installing the Console consists of these steps and no others. None of them runs a command inside a node other than Composer.

1. Require the package with Composer.
2. Enable the modules `console` and `cron` in `module.enable`.
3. Make sure `config.php` holds the `database.*` settings of the database the Console is to use, or point the Console at another one in `module_console.php` (section 2.4).
4. Add the Console's source to `metadata.sources` (section 2.5).
5. Add the fragment to `config/authsources.php` (section 2.6).
6. Give the web server user a writable, node-local directory for Snapshots (section 2.3).
7. Open the Console as the SimpleSAMLphp administrator and apply the pending migrations with the button on the page it shows (section 4.6).
8. Have an external scheduler call the core `cron` URL of every node, also when there is only one (section 2.7).

Steps 1 to 6 are repeated identically on every node. Step 7 is done once per deployment.

### 2.3 Module configuration

The module reads its options from `config/module_console.php`. The file is optional; every option has a default.

| Key | Default | Meaning |
| --- | --- | --- |
| `useridattr` | unset | Attribute of the `admin` session whose first value is recorded as the identity in the Audit trail and on Snapshots. When unset, or when the attribute is missing or empty, the identity is the constant `admin`. Access is never refused because of it. |
| `cron_tag` | unset | The `cron` tag on which the node checks for a newer Snapshot. When unset, the node checks on every tag. |
| `database` | core `database.*` | Points the Console at a different database than the one in `config.php` (section 2.4). |
| `snapshot_dir` | `/var/lib/simplesamlphp/console` | Node-local directory holding the node's copies of Snapshots. Writable by the web server user only. |
| `secrets_dir` | `/run/secrets` | Directory in which `%secret(name)%` is resolved on the node. |
| `node_id` | the hostname | Name under which the node reports its status. |
| `node_forget_after` | `3600` | Seconds without a check after which a node is dropped from the node list. |
| `snapshot_retention` | `10` | Number of Snapshots kept in the database. |
| `cert_expiry_warning_days` | `30` | Days before its expiry that a certificate is flagged. |
| `dev_server` | `false` | Development only: the page shell references the Vite development server's paths on the same origin instead of the built files (section 10.17). Never set in production. |

The Snapshot directory is an absolute path outside `cachedir`. Core caches the module's kernel under `<cachedir>/console` and an upgrade clears it; a Snapshot under `cachedir` would be lost to a cache wipe and leave the node with nothing to serve while the database is down.

### 2.4 Database settings

By default the Console builds its connection from the core settings `database.dsn`, `database.username`, `database.password` and `database.prefix`. It ignores `database.slaves` and `database.persistent`: it always uses the primary and never a persistent connection.

The optional `database` key of `module_console.php` is a nested array with `dsn`, `username`, `password` and `prefix`. When present it replaces the four core values as a whole, with no per-key merge. `dsn` is required inside it; `username` and `password` default to `null` and `prefix` to `''`.

SQLite is for single-node deployments and for tests. In a container its file needs a persistent volume. A deployment with more than one node requires PostgreSQL, MariaDB or MySQL.

### 2.5 `metadata.sources`

The administrator adds `['type' => 'console:Snapshot']` to `metadata.sources` in `config.php`. Core resolves it to `SimpleSAML\Module\console\MetadataStore\Snapshot`. It takes no database settings: it serves the node-local Snapshot.

The order of `metadata.sources` decides which source wins when the same entity ID exists in more than one for the same set; core has no other mechanism. The documentation recommends listing the Console's source first. The Console does not enforce it; it reports each collision as an Override or as Shadowed according to the `config.php` of the node serving the page (section 9).

The core `pdo` source may stay in `metadata.sources`. The Console then warns on that node's Nodes screen that SSO depends on the database.

### 2.6 The `authsources.php` fragment

Managed authsources reach core through a fragment the administrator adds by hand, once, to `config/authsources.php`. The Console never writes it. See [ADR 0005](docs/adr/0005-managed-authsources-through-a-hand-added-fragment.md).

The fragment is one expression: a call to `\SimpleSAML\Module\console\Authsources::merge()`, guarded with `class_exists()`. It is the last thing the file executes, in one of two documented forms. As the last statement:

```php
$config = class_exists(\SimpleSAML\Module\console\Authsources::class)
    ? \SimpleSAML\Module\console\Authsources::merge($config)
    : $config;
```

Or as the file's `return`, wrapping the array of File authsources in the same call.

`class_exists()` is true when the package is installed but the module is not enabled, so `merge()` checks that the module is enabled and otherwise returns the array untouched.

The fragment itself never changes between module versions. All logic lives in the method it calls (section 3.2).

Without the fragment, managed authsources can be edited and published but have no effect on that node, and the node reports it as a problem when the current Snapshot holds managed authsources.

### 2.7 `cron`

A running node learns of a Publication when the core `cron` module fires. A call every minute is recommended. Triggering the `cron` URL from an external scheduler is the expected setup; nothing runs inside the node's container.

Behind a load balancer the scheduler must reach each node directly, since a call that goes through the balancer updates only the node that receives it.

`cron` is required on every deployment, single-node included. The node that serves a Publication or Rollback request updates itself within that request, so the change is visible there at once, and a node with no local Snapshot fetches one on its first request. `cron` is what keeps every node reporting (section 3.5) and its Secret references current (section 7.2); none of those rules has a single-node variant.

### 2.8 What the deployment must keep identical across nodes

- The module version. The Snapshot carries Console documents that each node translates, so a node with other code may translate differently or not at all. Every node is upgraded before the next Publication.
- `metadata.sources`, in the same order.
- The File authsources in `config/authsources.php`, and the modules of every Authsource type in use, installed and enabled.
- The key and certificate files that Key references point to.
- The secrets and environment variables that Secret references name.

### 2.9 Upgrading

Upgrading is a Composer update of the package on every node. SimpleSAMLphp caches each module's routes and services under its `cachedir`, so that cache is cleared as part of the update.

When the new code carries migrations the database lacks, every Console route answers with the pending migrations page until they are applied (section 4.7). Migrations are forward-only: the page says, before applying anything, that undoing one means restoring a backup. SSO is unaffected throughout. Until every node is updated, a node still on the older code that serves the Console shows "Console older than the database" once the migrations are applied.

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
                                           or the node serving a
                                           Publication or Rollback)
```

### 3.2 Integration points with SimpleSAMLphp

| Point | Mechanism | Use |
| --- | --- | --- |
| Web interface | Routes under `routing/routes/` and autowired controllers in `src/Controller/`: one page shell rendered through core's `Template` class, and the JSON API; the built front end under `public/assets/app/`, resolved through Vite's manifest | Every Console screen |
| Access control | `requireAdmin()` | The only access check (section 3.8) |
| Metadata | `SimpleSAML\Module\console\MetadataStore\Snapshot`, named `console:Snapshot` in `metadata.sources` | Serves managed entities from the local Snapshot |
| Authsources | `Authsources::merge()`, called by the fragment in `authsources.php` | Merges managed authsources from the local Snapshot into the file's array |
| Periodic check | A listener for core's `CronEvent`, under `src/Event/Listener/` | Fetches a newer Snapshot and reports the node's status |
| Sanity check | A listener for core's `SanityCheckEvent` | Shows the node's problems on core's admin page |
| Entry in core's admin interface | A listener for the admin module's `ConfigPageEvent` | A "Console" link on the Configuration tab |

The module uses PSR-14 listeners only. It ships no legacy `hooks/` files.

**The `MetadataStore`** extends core's `MetaDataStorageSource`. It reads the `current` file once per request, loads the PHP file of the requested set from the build it names, and catches every error of its own: when the local Snapshot is missing or unreadable it returns no entities and logs a warning, so the other sources keep answering.

**The fragment's method** takes the array of File authsources and returns it merged with the managed ones. It catches every `\Throwable`, leaks no variables into the scope of `authsources.php`, and merges with `+`, so a File authsource always wins over a managed authsource with the same id. An unreadable `authsources.php` of the build is ignored as a whole with a warning; inside a readable file, each entry is checked again (an array, a string at key `0`, an id that is not an integer) and only invalid entries are dropped. It records that it ran, which is how a node detects a missing fragment.

**The entry in core's admin interface** never queries the database and catches its own errors, so a stale schema or an unreachable database never breaks core's admin page.

The entry is a link, not a tab: the Console's own shell does not render core's tab bar, and `AdminMenuEvent` has no method to add an entry. The listener appends `['href' => ..., 'text' => 'Console']` to the template's `links`.

### 3.3 Documents, schemas and translators

A managed entity or a managed authsource is stored as a **Console document**: a JSON document that is not the PHP array core expects. Several options do not fit JSON as core takes them (the authsource type at key `0`, credentials inside array keys, absent versus `null`), and Key references, endpoints and localized strings need a regular shape.

Each of the three entity sets and each of the five Authsource types has:

- a **JSON Schema** (2020-12) describing its document, with annotations for sensitive values, authsource references and presentation;
- a PHP class holding the **cross-field rules** the schema does not express;
- a **translator** from the document to the array core expects;
- an **inverse translator** from that array back to the document, used by the PHP view, by Import and by creation from pasted configuration.

Authsource schemas are closed: an option outside the schema is rejected. Entity schemas are open through an `extra` bag of uncataloged options. See [ADR 0006](docs/adr/0006-closed-catalog-of-authsource-types.md) and [ADR 0008](docs/adr/0008-open-entity-documents-with-an-extra-bag.md). The schemas and their rules are specified in sections 5 and 6.

The catalog of schemas ships with the module. A deployment or another module cannot add to it. The front end compiles the same schemas at build time to validate while editing and to generate its TypeScript types; the server's validation stays authoritative (section 10.10).

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
- **Publication or Rollback.** The node that serves the Publication or Rollback request updates itself within that request. After a Rollback it always rebuilds, even when it still holds a build of that number, because secrets may have rotated.

**Building the local copy.** After fetching, the node verifies the checksum and the format version, resolves every Secret reference, checks every Key reference, translates each document, and writes the result. An object that cannot be built (an unresolved Secret reference, a current key or certificate that fails its check, a document the node's code cannot translate) is left out of that node's copy alone; the rest is served. The per-object rules are in sections 7 and 11.

A node whose code is older than the Snapshot's format version keeps the local copy it has, or serves nothing from the Console if it has none. It never falls back to an earlier Snapshot.

On every `cron` check the node resolves the Secret references of the current Snapshot again and writes a new build only when the result differs. A rotated secret therefore needs no Publication and takes effect within one `cron` cycle.

**On disk.** The Snapshot directory holds one directory per build, `<dir>/<n>-<b>/`, where `n` is the Snapshot number and `b` starts at 1 and grows with every rebuild of the same number (a rotated secret, a Rollback to a number still on disk). A file is never rewritten in place: with `opcache.validate_timestamps=0` PHP would keep serving the old one. A build holds:

- `saml20-sp-remote.php`, `saml20-idp-remote.php`, `saml20-idp-hosted.php` and `authsources.php`, each a `return [...]` of arrays ready for core;
- `manifest.json`, fixed for the build: Snapshot number, format version, checksum, build time, module version, and the objects and slots left out with their reason.

Next to the builds:

- `<dir>/current`, a text file holding the name of the build being served, replaced by atomic rename and read once per request. It is not a symlink.
- `<dir>/status.json`, rewritten on every check: time and outcome of the last check, the environment problems listed below, the "nothing published yet" mark and the time of the last failed fetch for the 60-second wait.

Files are readable by the web server user only (`0600`), because secrets are resolved in them. The current and the previous build are kept; older ones are removed. The Nodes screen, served by this node, reads `manifest.json` of the current build and `status.json`.

**Status.** After each check, each first-request fetch and each Publication or Rollback it serves, the node writes its identifier, the number it serves, the time of the check and a "has problems" flag to the Node table. A failed write is logged and ignored. Nothing else about a node reaches the database.

What the problems are stays on the node's disk and is shown by that node only: on the Nodes screen when that node serves it (section 10.16), in its `cron` summary and in core's sanity check:

- objects or slots left out of its build, each with its reason;
- managed authsources Shadowed by a File authsource of that node;
- a missing `authsources.php` fragment, when the current Snapshot holds managed authsources;
- `console:Snapshot` missing from `metadata.sources`; the node still fetches and builds Snapshots, since managed authsources depend on them;
- the core `pdo` source in `metadata.sources`.

Behind a load balancer the administrator sees which node has problems and has to reach that node to read them.

**With the database down**, a node keeps serving its local copy indefinitely.

### 3.6 Code layout

The module's code under `src/` is split in three layers. Dependencies point inwards only.

| Layer | Holds | May not use |
| --- | --- | --- |
| `Domain` | Documents, validation, translators, Pending changes, the Snapshot | `SimpleSAML\*`, PDO, HTTP |
| `Application` | One use case per class: save, publish, Rollback, Import and the like | PDO, HTTP |
| `Infrastructure` | Persistence, integration with core, the page shell and the JSON API | |

- SQL and `PDO` appear only in the persistence namespace, behind repository interfaces.
- The serving side (the `MetadataStore` and the fragment's method) does not depend on persistence, except for the first-request fetch.
- There is no command bus, no domain events, no CQRS and no value object per scalar. An interface exists only where two real implementations do: the database engines and test doubles.

These boundaries are enforced by the architecture checks of section 12.

The front end lives in `frontend/`, outside `src/`, in the layers of section 10.17. It is a client of the JSON API only. The API is a client of `Application`, as any other controller.

### 3.7 Dependencies

| Package | Use | Status |
| --- | --- | --- |
| `opis/json-schema` `^2.6` | JSON Schema 2020-12 validation | Added by the module |
| `nikic/php-parser` | Reading pasted PHP array literals without executing them | Already a production dependency of SimpleSAMLphp 2.5 |
| `symfony/var-exporter` | Writing PHP arrays | Already shipped with SimpleSAMLphp 2.5 |

The module adds no database abstraction layer and no Symfony CSRF component.

The front end has a build step (section 10.17). Its npm dependencies are pinned to exact versions in a committed `package-lock.json` and never reach an installation, which receives only the built files:

| Package | Use |
| --- | --- |
| `react`, `react-dom` | Components |
| `react-router` | Client routing over the Console's paths |
| `react-aria-components` | Keyboard, focus, ARIA and press behaviour of the design-system primitives |
| `ajv` | Compiling the schemas into standalone JSON Schema 2020-12 validators at build time. Only the compiled validators ship; the `format` rules they call are implemented in the front end to match opis |
| `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom` | Build and type checking |
| `eslint`, `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-boundaries`, `eslint-import-resolver-typescript` | Lint, including the rules of section 12.4 |
| `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/dom`, `jsdom` | Unit tests in jsdom and the coverage of every test project |
| `@vitest/browser`, `@vitest/browser-playwright`, `playwright` | Story tests and page screenshots in Chromium |
| `storybook`, `@storybook/react-vite`, `@storybook/addon-vitest`, `@storybook/addon-a11y`, `@storybook/addon-docs` | Stories, Foundations docs, and the axe check on every story |
| `json-schema-to-typescript` | Types generated from the schemas |

Adding an npm package is a decision recorded in this table.

`opis/json-schema` is configured to report every error rather than stop at the first, and with defaults off: validation never writes a `default` into a document.

### 3.8 Requests

- Every Console route calls `requireAdmin()`. There is no other permission check. The page shell lets core redirect to its login; an API route answers 401 instead.
- No GET request changes state. Every state-changing request is a POST to the API with a JSON body, carrying the request-forgery token kept in the SimpleSAMLphp session in an `X-Console-Token` header, and answers JSON (section 10.1). A preference kept in the session, such as the last view of the edit screen, is not state in this sense.
- Core's kernel runs no listeners for a module, so the checks are explicit: one service calls `requireAdmin()`, checks the state of the database and, for a POST, validates the token and the `application/json` content type, and every API route goes through it. A request without a valid token gets HTTP 403; nothing is written to the Audit trail and a warning goes to the SimpleSAMLphp log.
- After `requireAdmin()` and before anything else, every API route checks the state of the database and answers 503 with that state when it cannot proceed, Run migrations excepted (section 4.7). The interface shows the state page.
- API responses that carry a sensitive value, stored or not yet stored, are served with `Cache-Control: no-store` (section 7.3).
- Every page passes core's default Content Security Policy, in production and in development: no inline scripts, no inline styles, no `style` attributes, nothing loaded from another origin, no `eval`.

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
| `external_fingerprint` | For a managed entity created from an External entity, or marked as reviewed against one, the fingerprint of the External entity it was last compared with (section 9.4); otherwise null. Updating it does not change `version`. |
| `created_at`, `updated_at` | Timestamps |

Deleting a managed entity deletes its row. There is no per-row Publication state: the state of an object is computed against the current Snapshot (section 8).

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
| `format_version` | Version of the layout of `document`, `1` in v1. A node whose code knows only a lower one does not use the Snapshot. |
| `checksum` | SHA-256, lowercase hex, of the exact bytes stored in `document`, verified by nodes and before a Rollback. It detects corruption, not tampering. |
| `document` | The whole Snapshot as one JSON document: every enabled managed entity and managed authsource as Console documents, with Secret references unresolved and literal secrets in clear |
| `comment` | The optional comment given at Publication |
| `created_at` | When it was published |
| `created_by` | The identity that published it |

A row is never updated. Rows are deleted only by the purge of section 4.10.

The `document` holds lists, not maps, because PHP decodes a numeric-looking key such as `"123"` as an integer and encodes an empty map as `[]`:

```json
{
  "entities": {
    "saml20-sp-remote":  [{"entityid": "https://sp.example.org", "document": {}}],
    "saml20-idp-remote": [],
    "saml20-idp-hosted": []
  },
  "authsources": [{"id": "default-sp", "type": "saml:SP", "document": {}}]
}
```

- Each list is sorted bytewise by entity ID or by id. The three sets are always present, empty or not.
- It holds content only: no number, dates, author or per-object `version`, which live in the columns. The same content gives the same bytes.

The format version rises only when an older node would misread the document without noticing: a change of the envelope above, or of the meaning of an existing option. A new option or a new Authsource type does not raise it: an older node cannot translate that object, leaves it out of its copy and sets its flag.

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
| `has_problems` | Whether the node has anything to report on its own Nodes screen |

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
| `document` | The full Console document as it stood after the change, with every sensitive value replaced by a marker that says only whether it changed. A Secret reference is stored as is. Null whenever no loadable document exists after the change: every `delete`, a change that leaves the object Unreadable, and `publish`, `rollback` and `migrate`. The raw bytes of an Unreadable row are never copied here. |
| `snapshot_from`, `snapshot_to` | For `publish` and `rollback`, the current number before and after |
| `comment` | For `publish`, the Snapshot's comment, copied so that it survives the purge |
| `schema_version` | For `migrate`, the schema version after the run |

Two indexes serve the Audit trail of one object: (`entity_set`, `entity_id`) and (`authsource_id`). Because objects are matched by their natural key, an entity deleted and created again under the same entity ID and set continues one Audit trail.

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
- A run is recorded in the Audit trail as described in section 4.4. A run that applies nothing leaves no row.

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

After `requireAdmin()` and before doing anything else, every Console route establishes which of these states the database is in. Only the first lets the request proceed, except Run migrations (`POST /api/migrate`), which also proceeds in the two pending migrations states and in no other; each of the others has a page of its own and is an ordinary state, not an exception. When the schema already matches the code, as after another administrator's run, Run migrations applies nothing and answers that the schema is already up to date.

| State | Page |
| --- | --- |
| Schema matches the code | The requested screen |
| Database unreachable | "Database unreachable" |
| SQLite older than 3.24.0 | "SQLite too old" |
| Versions table missing, as on a fresh install | Pending migrations |
| An applied number is greater than N | "Console older than the database" |
| Applied numbers are not exactly 1 to N | Pending migrations |

The states are checked in this order. Any applied number above N means "Console older than the database" even when lower numbers are also missing, because older code never runs migrations. This happens during a rolling upgrade, when a node that has not been updated serves the Console.

The pending migrations page takes the whole content area, warns that a migration cannot be undone without restoring a backup, and carries the button that runs the migrations (section 10.5).

The "Console older than the database" page blocks the whole Console, reads included, since code that does not know the schema must not use it. It has no button, shows the schema version the code knows next to the one the database holds, and asks for the package to be updated on this node.

None of these states affects SSO, which reads only the local Snapshot.

### 4.8 Concurrency

No advisory locks and no global edit counter are used. Races are settled by conditions on `UPDATE` statements and by primary keys.

**Saving an object.** A save sends the `version` the object was loaded with. The save is `UPDATE … SET version = version + 1 … WHERE version = ?`. Zero rows means the object changed or was deleted meanwhile, and the save is rejected. Every change that can become a Pending change increments `version`, enabling and disabling included.

**Creating an object that already exists.** On save the Console first checks whether the (set, entity ID) or the authsource id exists. If it does, the editor keeps what was typed and shows an "already exists" error at the line that holds the entity ID or authsource id, with a link to the existing object. A primary-key clash on `console_entity` or `console_authsource` after that check passed, a lost race, gives the same error and not the conflict error below, which would reload someone else's object and throw away what was typed. In a multi-entity create (section 9.6) such an entity is skipped with the reason "already exists".

**Publication.** One transaction:

1. It runs at `REPEATABLE READ`, set with `SET TRANSACTION ISOLATION LEVEL`, because entities and authsources are read in separate queries and must describe one instant. On SQLite it opens with `BEGIN IMMEDIATE` and a 5 second `busy_timeout` instead, so the loser of a race waits and then fails at step 2 or 3.
2. It recomputes a hash of the Pending changes, made of their keys and `version` values, and compares it with the hash the confirmation screen was loaded with. A mismatch shows the confirmation screen with the current state.
3. It takes the next number with `UPDATE console_pointer SET last_number = ?, current_number = ? WHERE last_number = ?`, the new values being the old `last_number` plus one.
4. It inserts the Snapshot row and the `publish` row of the Audit trail.

**Rollback.** `UPDATE console_pointer SET current_number = ? WHERE current_number = ?`, the condition being the number the confirmation screen showed, together with the `rollback` row of the Audit trail. Zero rows shows the confirmation screen again.

**One conflict error.** A lost race does not look the same on every engine. The persistence layer turns all of its shapes into a single conflict error, for every write the Console makes and not only for a Publication:

| Shape | Where |
| --- | --- |
| Zero rows updated | Any engine for a save or a Rollback; for the pointer update of a Publication, MariaDB 10.11, MySQL and SQLite only |
| Primary-key clash on the Snapshot | Any engine |
| SQLSTATE `40001` | PostgreSQL serialization failure; deadlock on MariaDB and MySQL |
| SQLSTATE `40P01` | PostgreSQL deadlock |
| Driver error code 1020, reported under SQLSTATE `HY000` | MariaDB 11.6.2 and later |
| `SQLITE_BUSY` after the `busy_timeout` | SQLite |

For the administrator the outcome is always the same: the editor or the confirmation screen shows the current state. Nothing is retried automatically.

### 4.9 Snapshot size

A Snapshot is one row, so on MariaDB and MySQL its size is bounded by `max_allowed_packet`.

Before inserting the Snapshot on those engines, a Publication reads `@@max_allowed_packet` and is blocked, with a message naming the variable, when the document is larger than that value minus 1 MiB. With the engines' defaults this allows 15 MiB on MariaDB and 63 MiB on MySQL.

The Console sets no limit of its own, applies none on PostgreSQL or SQLite, and gives no warning when a Snapshot approaches the limit.

### 4.10 Retention

- **Snapshots.** The database keeps the configured number of Snapshots, 10 by default. A Publication purges the oldest beyond that number. The current Snapshot is never purged, whatever its age. A Rollback can only target a retained Snapshot. Snapshots are not all kept because they hold literal secrets in clear, and a rotated secret would otherwise stay in the database for ever.
- **Nodes.** A node that has not checked for the forgetting interval, one hour by default, is dropped from the node list and its row deleted. No manual action exists or is needed.
- **Audit trail.** Never purged in v1.

## 5. Managed entities

### 5.1 What a managed entity is

A managed entity is one row of `console_entity` (section 4.4): a set, an entity ID, an enabled flag and a Console document holding its metadata. The set, the entity ID and the flag are not part of the document.

**Set.** One of `saml20-sp-remote`, `saml20-idp-remote` and `saml20-idp-hosted`, chosen when the entity is created. It cannot be changed afterwards.

**Entity ID.**

- It is not empty, is at most 1024 bytes long and is compared byte for byte (section 4.3).
- It cannot be changed once the entity exists. Renaming is duplicating and deleting.
- Two managed entities of the same set cannot share an entity ID. The same entity ID may be a managed entity in more than one set.
- In `saml20-idp-hosted`, `__DEFAULT__` and `__DYNAMIC:<n>__` are rejected: the entity ID is always written out.
- An entity ID that is not an absolute URI is accepted with a warning (section 5.9).

**Enabled flag.** A disabled managed entity does not travel in the Snapshot. Enabling and disabling are Pending changes like any other and have no effect before the next Publication (section 8).

A managed entity may share its entity ID and set with an External entity; it is then an Override or Shadowed, depending on the order of `metadata.sources` (section 9).

### 5.2 How a managed entity reaches core

Core asks the module's `MetadataStore`, named `console:Snapshot` in `metadata.sources` (section 2.5), for the entities of a set. The store reads the PHP file of that set from the build the node is serving (section 3.5): a `return` of an array keyed by entity ID, each entry already translated into what core expects, with Secret references resolved. It catches every error of its own (section 3.2).

Which source wins for an entity ID is decided by the order of `metadata.sources`, never by the Console. Core validates only `expire` and the presence of an entity ID when it loads an entity; everything else is checked lazily by whichever code reads the option. The Console therefore validates every document itself (sections 5.7 and 5.8).

### 5.3 The catalog

| Set | Schema | Example document and array |
| --- | --- | --- |
| `saml20-sp-remote` | [`saml20-sp-remote.json`](docs/spec/schemas/entities/saml20-sp-remote.json) | [`saml20-sp-remote.json`](docs/spec/examples/entities/saml20-sp-remote.json), [`saml20-sp-remote.php`](docs/spec/examples/entities/saml20-sp-remote.php) |
| `saml20-idp-remote` | [`saml20-idp-remote.json`](docs/spec/schemas/entities/saml20-idp-remote.json) | [`saml20-idp-remote.json`](docs/spec/examples/entities/saml20-idp-remote.json), [`saml20-idp-remote.php`](docs/spec/examples/entities/saml20-idp-remote.php) |
| `saml20-idp-hosted` | [`saml20-idp-hosted.json`](docs/spec/schemas/entities/saml20-idp-hosted.json) | [`saml20-idp-hosted.json`](docs/spec/examples/entities/saml20-idp-hosted.json), [`saml20-idp-hosted.php`](docs/spec/examples/entities/saml20-idp-hosted.php) |

Each example is one valid document next to the `$metadata[...]` statement a flat file would hold for it. A Secret reference in a document appears in the array as the value a node resolved it to.

Each set has, besides its schema, a PHP class that holds its cross-field rules, its translator and its inverse translator (section 3.3).

**What is cataloged.** An option is cataloged for a set when SimpleSAMLphp 2.5 reads it from an entity of that set, documented or not, or when `SAMLParser` emits it for that set, so that an entity created from XML metadata does not start out with `extra`. An option the reference documentation lists but no code reads is not cataloged. Options owned by modules outside core are never cataloged. The full lists are in sections 5.11 to 5.13.

**What is not.** Unlike the authsource catalog, the entity schemas are open: an option they do not catalog goes in the `extra` bag (section 5.6). See [ADR 0008](docs/adr/0008-open-entity-documents-with-an-extra-bag.md).

### 5.4 Schema conventions

Every entity schema follows the conventions of section 6.6: JSON Schema 2020-12, `additionalProperties: false` on the root and every nested object, core's option names, `title` and `description` with the fallback in the help text, `default` and `examples` as hints only, declaration order as form and PHP order, `$ref` only to files of the catalog, `$error` on every `pattern`, and the annotations `x-sensitive`, `x-literal`, `x-authsource-reference`, `x-groups`, `x-widget` and `x-when`.

What differs:

- **Open root.** The root carries `additionalProperties: false` like any other object, but holds an `extra` option of free-form JSON (section 5.6).
- **Where `x-literal` applies.** In the entity schemas: `host` and `auth` of `saml20-idp-hosted`, every `Location` and `ResponseLocation` through the shared `url` shape, and every `Binding` of a remote entity through `remoteBinding`. The entity ID is not part of the document.
- **Key slots have names of their own.** Core spreads a key over prefixed options (`privatekey`, `new_certData`, `signature.certificate`…). The document groups them in one option per slot, named with an underscore so that it cannot be mistaken for a core option: `key`, `next_key`, `signature_key`, `metadata_sign_key`, `https_certificate` and `certificates`. `privatekey`, `certificate`, `certData`, `keys`, `key_name` and their prefixed forms are never options of their own.
- **No defaults on tri-state options.** `validate.authnrequest` and `validate.logout` are optional booleans without `default`: not set means "check a signature when one is present", `false` means "never check, even when signed". Every other `default` stays as a hint (section 6.6).
- **Precedence in the help text.** Many options fall back to the other side of the exchange. The help text of each option says which side wins, as the code does it: for `sign.logout` and `sign.authnrequest` the sender's value wins, the reverse of what the reference documentation states.

### 5.5 Shared shapes

The entity schemas use the shapes of section 6.7 (`stringList`, `languageMap`, `languageListMap`, `signatureAlgorithm`, `authproc`, `keySlot`, `certificate`, `contacts`, `EntityAttributes`, `UIInfo`, `RegistrationInfo`) and these, also defined in [`common.json`](docs/spec/schemas/common.json):

**URL** (`url`). An absolute `http` or `https` URL, marked `x-literal`. Every `Location` and `ResponseLocation` uses it.

**Binding** (`binding`). One of the SAML 2.0 bindings core implements. Only the `Bindings` of a hosted endpoint use it, because that is the Console's own configuration:

| Binding |
| --- |
| `urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect` |
| `urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST` |
| `urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Artifact` |
| `urn:oasis:names:tc:SAML:2.0:bindings:SOAP` |
| `urn:oasis:names:tc:SAML:2.0:bindings:PAOS` |
| `urn:oasis:names:tc:SAML:2.0:profiles:holder-of-key:SSO:browser` |

**Remote binding** (`remoteBinding`). Any non-empty absolute URI, marked `x-literal`. Real metadata carries bindings core does not implement (`HTTP-POST-SimpleSign`, the SAML 1.x profiles of a Shibboleth SP, the `URI` binding); an endpoint that uses one is kept as it is, never rejected, never dropped by Import, paste or "Replace from…", and gets no warning of its own. Core skips it when it chooses an endpoint. It carries `x-widget: suggest`, so the form offers the bindings in its `examples`, those above, as suggestions and accepts free text (section 10.10).

**Usable endpoint.** An endpoint of a remote entity is usable when its binding is one core uses for that service:

| Service | Usable bindings |
| --- | --- |
| `AssertionConsumerService` | HTTP-POST, HTTP-Artifact, holder-of-key SSO browser, PAOS |
| `SingleSignOnService` | HTTP-Redirect, HTTP-POST |
| `SingleLogoutService` | HTTP-Redirect, HTTP-POST |
| `ArtifactResolutionService` | SOAP |

A required service with no usable endpoint blocks the save (section 5.7). This also keeps out a trap in core: when a service has a single endpoint with a binding core does not implement, `Configuration::getEndpoints()` rewrites it to the service's default binding, so an SP whose only assertion consumer service is SAML 1.x would be sent a SAML 2.0 response over HTTP-POST. An optional service whose endpoints are all unusable gets a warning (section 5.9).

**Endpoints.** The remote sets hold each service as a list of endpoints, in the order core tries them. Two shapes follow the SAML metadata schema:

| Shape | Fields | Used by |
| --- | --- | --- |
| `endpoint` | `Binding` (a remote binding), `Location`, optional `ResponseLocation` | `SingleSignOnService`, `SingleLogoutService` |
| `indexedEndpoint` | `Binding` (a remote binding), `Location`, optional `index` (integer, 0 or more) and `isDefault` | `AssertionConsumerService`, `ArtifactResolutionService` |

`DiscoveryResponse` of `saml20-sp-remote` is an indexed endpoint whose `Binding` is always `urn:oasis:names:tc:SAML:profiles:SSO:idp-discovery-protocol`.

**Hosted endpoint** (`hostedEndpoint`). `SingleSignOnService` and `SingleLogoutService` of `saml20-idp-hosted` are not endpoint lists in core but one URL plus a list of bindings. The document holds `{Location?, Bindings}`: `Bindings` is a non-empty list of distinct bindings; `Location` is normally absent, and core then derives it from its base URL.

**Certificates of a remote entity** (`remoteCertificates`). A list of pasted certificates, each `{pem, use}` with `use` one of `signing`, `encryption` or `both`. The Console holds them; they are never file references. The list is emitted as core's `keys`, in the same order: each row becomes `{type: "X509Certificate", signing, encryption, X509Certificate}` with the base64 body. As for key slots (section 6.7), a pasted certificate is rewritten as PEM with armour and 64-character lines on save.

**Key slots.** The `keySlot` of section 6.7. In every entity schema a slot that is set requires both `privatekey` and `certificate`.

**Attributes released** (`attributePolicy`). Core takes a list of names, a map of name to allowed values, or both mixed. The document holds rows `{name, values?}`; a row without `values` becomes a positional name, a row with them becomes `name => values`.

**Attribute encodings** (`attributeencodings`). Rows `{name, encoding}`, `encoding` one of `string`, `base64` and `raw`, translated to core's map.

**Discovery hints** (`DiscoHints`). Optional lists `IPHint`, `DomainHint` and `GeolocationHint`, at least one present.

**Shared key algorithm** (`sharedkeyAlgorithm`). The seven block ciphers of the XML encryption library: AES-128, AES-192 and AES-256 in GCM and in CBC mode, and Triple DES.

Rows keyed by `name` reject a repeated name on save, as in section 6.7.

### 5.6 `extra`

`extra` is an object of options the set's schema does not catalog. The translator merges it as it is into the array core receives, after the cataloged options. It is the only place a document can carry such an option.

- It is neither validated nor masked. Whatever is in it is shown in clear wherever the entity is shown.
- It may not contain a key the translator emits from a cataloged option (for example `keys`, `certData`, `new_privatekey`, `SingleSignOnServiceBinding`, or a cataloged option's own name), so it cannot bypass validation, masking or Key references.
- It may not contain `expire`, nor the keys core adds itself: `entityid`, `metadata-set` and `metadata-index`.
- It accepts no Secret references: a string anywhere inside it that has the form of one is rejected.
- An empty `extra` is not stored; the option is unset instead.
- Every managed entity that uses `extra` carries a warning (section 5.9).

In the form, `extra` is alone in the last group, "Uncataloged options", edited as JSON text and shown only once added (section 10.10).

### 5.7 Validation on save

A managed entity is saved only when it is valid on its own. There are no invalid drafts.

1. The entity ID rules of section 5.1, when the entity is created.
2. The schema of the set, with `opis/json-schema` reporting every error.
3. The cross-field rules of the set's class (sections 5.11 to 5.13) and the rules below.

Errors of all three are reported together, each by the JSON pointer of the value it concerns. The Console never runs an entity through core to validate it.

**Minimum content**, in the schemas:

- `saml20-sp-remote`: at least one usable `AssertionConsumerService` endpoint (section 5.5).
- `saml20-idp-remote`: at least one usable `SingleSignOnService` endpoint and at least one certificate whose `use` is `signing` or `both`.
- `saml20-idp-hosted`: `host`, `auth` and the `key` slot.

**Rules that apply to every set**

- Every `Location` and `ResponseLocation` is an absolute `http` or `https` URL. Every `Binding` of a remote entity is an absolute URI; every binding of a hosted endpoint is in the enum of section 5.5.
- Within one service, no two endpoints share an `index` and at most one is `isDefault`.
- A signature algorithm outside `signatureAlgorithm`, or a shared key algorithm outside `sharedkeyAlgorithm`, is rejected by the schema.
- A processing filter whose `class` names `core:PHP`, in the short form or as the full class name, is rejected; an entity that needs it stays an External entity. Two filters with the same priority are rejected.
- A pasted certificate that cannot be parsed is rejected. In a private key or certificate file reference, a `pdo://` location and a `%secret(name)%` reference are rejected.
- The rules of `extra` (section 5.6).

**Secret references.** The rules of section 6.8 apply: only in a string without an `enum` and without `x-literal`, filling the whole value, with `pattern` and `format` skipped. Inside the free-form configuration of a processing filter any string may be one; inside `extra`, none.

**Sensitive values.** The options annotated `x-sensitive` are:

| Set | Sensitive options |
| --- | --- |
| `saml20-sp-remote` | `sharedkey`, `privatekey_pass` of `signature_key` |
| `saml20-idp-remote` | `sharedkey`, `privatekey_pass` of `signature_key` |
| `saml20-idp-hosted` | `privatekey_pass` of `key`, `next_key` and `metadata_sign_key` |

A stored literal of a sensitive option is sent only to the edit screen of its own entity; everywhere else it is a marker (sections 7 and 10). `contacts` hold personal data and are not masked. Neither is anything in `extra` or in the configuration of a processing filter; the Console recommends a Secret reference in a filter.

### 5.8 Checks at Publication

A Publication validates every enabled managed entity again and adds the checks that span objects. Each block names the entity.

**Blocks**

- Anything that would block a save, judged against the schemas and rules of the code that publishes. A module update that tightens a schema can therefore block Publication until the stored document is fixed or the entity disabled; the current Snapshot keeps being served.
- The `auth` of an enabled `saml20-idp-hosted` that is neither the id of an enabled managed authsource nor the id of a File authsource of the publishing node, checked as an `x-authsource-reference` (section 6.9).
- Two enabled managed `saml20-idp-hosted` with the same `host`, two `__DEFAULT__` included.
- A processing filter whose `class` does not resolve on the publishing node.

**Warnings, never blocking**

- An `auth` satisfied only by a File authsource: that File authsource has to exist on every node.
- The warnings of section 5.9, for the entities with Pending changes.
- Collisions with External entities: new Overrides, Shadowed managed entities and Overrides whose source has changed (section 9). Collisions never block.

### 5.9 Warnings

Warnings never block. They are computed for every enabled managed entity and shown on the entity list at all times, and on the Publication screen for the entities with Pending changes.

- A pasted certificate that has expired or expires within `cert_expiry_warning_days` (section 2.3). For a certificate file, only what the node serving the Console can read.
- SHA-1 as `signature.algorithm` or `metadata.sign.algorithm`.
- Signing or signature checking switched off: `saml20.sign.response`, `saml20.sign.assertion`, `sign.authnrequest`, `sign.logout`, `validate.authnrequest` or `validate.logout` set to `false`.
- An endpoint whose `Location` or `ResponseLocation` is `http`.
- An optional service (`SingleLogoutService`, `ArtifactResolutionService`) that has endpoints but none usable (section 5.5).
- An entity ID that is not an absolute URI.
- Use of `extra`.
- A `host` shared with an External `saml20-idp-hosted`.
- On save only, judged on the node serving the Console: a processing filter whose `class` does not resolve, a Secret reference that does not resolve, a key or certificate file that is missing, a private key that does not match its certificate.

### 5.10 Translation on the node

The Snapshot carries each enabled managed entity in the list of its set as `{entityid, document}`, with Secret references unresolved. A node that builds its local copy takes each one through the steps of section 6.10: resolve every Secret reference, check every Key reference (section 7), translate the document with the class of its set, and write the result, keyed by entity ID, into the build's PHP file for that set.

- A `next_key` slot that fails its check leaves out only that slot; the entity is served with its current key. Any other slot that fails leaves the whole entity out of that node's build.
- An entity whose document the node's code cannot translate is left out of its build, and the node flags itself (section 3.5).

Every translator follows the general rules of section 6.10, except that the entity ID is the array key and there is no type at key `0`. Besides:

- Key slots are emitted under core's names with the slot's prefix:

  | Slot | Prefix |
  | --- | --- |
  | `key` | none |
  | `next_key` | `new_` |
  | `signature_key` | `signature.` |
  | `metadata_sign_key` | `metadata.sign.` |
  | `https_certificate` | `https.`, certificate only |

  A slot emits `privatekey`, `privatekey_pass`, one certificate form (`certData` when pasted, `certificate` when a file) and `key_name`, each when set.
- `certificates` becomes `keys` (section 5.5).
- Rows keyed by `name` (`attributes`, `attributeencodings`, `EntityAttributes`, contact `attributes`) become core's maps; `authproc` rows become a map of priority to filter, as in section 6.7.
- `RegistrationInfo.instant` is emitted as a Unix timestamp in the remote sets, as `SAMLParser` writes it, and as the date-time string in `saml20-idp-hosted`, which core parses when it publishes the metadata.
- `extra` is merged last.

The test suite checks, for every set, that a managed entity reaches core as the same array as its flat-file equivalent (the differential test) and that document to PHP to document is the identity (section 12).

### 5.11 `saml20-sp-remote`

A remote service provider the hosted IdP sends assertions to. The schema catalogs 45 root options in nine groups, plus `extra` in a last group of its own. `AssertionConsumerService` is the only required one.

| Group | Options |
| --- | --- |
| Endpoints | `AssertionConsumerService`, `SingleLogoutService`, `DiscoveryResponse` |
| Keys | `certificates`, `signature_key` |
| Description | `name`, `description`, `OrganizationName`, `OrganizationDisplayName`, `OrganizationURL`, `UIInfo`, `contacts`, `EntityAttributes`, `RegistrationInfo`, `scope`, `hide.from.discovery` |
| Attributes | `attributes`, `attributesRegex`, `attributes.required`, `attributes.NameFormat`, `attributeencodings`, `simplesaml.attributes` |
| NameID | `NameIDFormat`, `nameid.encryption`, `SPNameQualifier` |
| Signing and validation | `saml20.sign.response`, `saml20.sign.assertion`, `signature.algorithm`, `sign.logout`, `redirect.sign`, `validate.authnrequest`, `validate.logout`, `redirect.validate`, `skipEndpointValidationWhenSigned` |
| Encryption | `assertion.encryption`, `sharedkey`, `sharedkey_algorithm` |
| Request and session | `audience`, `ForceAuthn`, `IDPList`, `ProxyCount`, `assertion.lifetime`, `core:statistics-id`, `core:logout-timeout` |
| Processing | `authproc` |

**Remodelled options**

| In the document | Core receives |
| --- | --- |
| `AssertionConsumerService`, `DiscoveryResponse`, lists of indexed endpoints | The lists |
| `SingleLogoutService`, a list of endpoints | The list; `ResponseLocation` is how a separate logout response address is given |
| `certificates` | `keys` |
| `signature_key`, a key slot | `signature.privatekey`, `signature.privatekey_pass`, `signature.key_name`, and `signature.certData` or `signature.certificate` |
| `name`, `description`, `OrganizationName`, `OrganizationDisplayName`, `OrganizationURL`, always language maps | The map |
| `NameIDFormat`, `IDPList`, `audience`, always lists | The list; core uses only the first `NameIDFormat` |
| `attributes`, `attributeencodings`, `contacts`, `EntityAttributes` | As in sections 5.5 and 6.7 |
| `skipEndpointValidationWhenSigned`, a boolean only | The boolean; core's callable form is not expressible |
| `authproc` | As in section 6.7 |

**Rules.** All in the class, besides those of section 5.7.

- No two rows of `attributes` or `attributeencodings` share a `name`.

**Left out**, so in `extra` when present: `SingleLogoutServiceResponse` and `encryption.blacklisted-algorithms`, which the code does not read for this set; `AttributeNameFormat`, a legacy alias of `attributes.NameFormat`.

### 5.12 `saml20-idp-remote`

A remote identity provider that the `saml:SP` authsources of the node send requests to. The schema catalogs 39 root options in eight groups, plus `extra` in a last group of its own. `SingleSignOnService` and `certificates` are required.

| Group | Options |
| --- | --- |
| Endpoints | `SingleSignOnService`, `SingleLogoutService`, `ArtifactResolutionService` |
| Keys | `certificates`, `signature_key` |
| Description and discovery | `name`, `description`, `OrganizationName`, `OrganizationDisplayName`, `OrganizationURL`, `icon`, `UIInfo`, `DiscoHints`, `hint.cidr`, `hide.from.discovery`, `contacts`, `EntityAttributes`, `RegistrationInfo`, `scope` |
| Authentication request | `AuthnContextClassRef`, `AuthnContextComparison`, `disable_scoping`, `IDPList`, `ProxyCount`, `NameIDFormats`, `nameid.encryption` |
| Signing and validation | `signature.algorithm`, `sign.authnrequest`, `sign.logout`, `redirect.sign`, `validate.logout`, `redirect.validate` |
| Encryption | `assertion.encryption`, `sharedkey`, `sharedkey_algorithm`, `encryption.blacklisted-algorithms` |
| Attributes | `attributes`, `attributesRegex` |
| Processing | `authproc` |

**Remodelled options**

| In the document | Core receives |
| --- | --- |
| `SingleSignOnService`, `SingleLogoutService`, lists of endpoints; `ArtifactResolutionService`, a list of indexed endpoints | The lists |
| `certificates`, with at least one for signing | `keys` |
| `signature_key`, a key slot | The `signature.` options, as in section 5.11 |
| `name`, `description`, `OrganizationName`, `OrganizationDisplayName`, `OrganizationURL`, always language maps | The map; core's discovery page ignores a plain string |
| `NameIDFormats`, `IDPList`, `hint.cidr`, `scope`, `encryption.blacklisted-algorithms`, always lists | The list |
| `AuthnContextClassRef`, a single string | The string; core throws on a list for this set |
| `attributes`, `contacts`, `EntityAttributes` | As in sections 5.5 and 6.7 |
| `authproc` | As in section 6.7 |

The names follow core per set: `NameIDFormats` here, `NameIDFormat` in the other two sets. They are not unified.

**Rules.** In the class, besides those of section 5.7.

- No two rows of `attributes` share a `name`.

**Left out**, so in `extra` when present: `NameIDPolicy`, which core reads and then overwrites with the SP's value; top-level `SPNameQualifier` and `base64attributes`, which the code does not read; `SingleLogoutServiceResponse`.

### 5.13 `saml20-idp-hosted`

The identity provider the node itself runs. The schema catalogs 43 root options in ten groups, plus `extra` in a last group of its own. `host`, `auth` and `key` are required.

| Group | Options |
| --- | --- |
| Identity and login | `host`, `auth` |
| Keys | `key`, `next_key`, `https_certificate` |
| Endpoints | `SingleSignOnService`, `SingleLogoutService` |
| Behaviour | `logouttype`, `saml20.ecp`, `saml20.hok.assertion`, `saml20.sendartifact`, `assertion.lifetime`, `errorURL` |
| Attributes | `attributes`, `attributesRegex`, `attributeencodings`, `attributes.NameFormat` |
| NameID | `NameIDFormat`, `nameid.encryption` |
| Signing and validation | `saml20.sign.assertion`, `saml20.sign.response`, `signature.algorithm`, `sign.logout`, `redirect.sign`, `validate.authnrequest`, `validate.logout`, `redirect.validate` |
| Encryption | `assertion.encryption`, `encryption.optional`, `sharedkey_algorithm` |
| Published metadata | `OrganizationName`, `OrganizationDisplayName`, `OrganizationURL`, `contacts`, `scope`, `RegistrationInfo`, `UIInfo`, `DiscoHints`, `EntityAttributes`, `metadata.sign.enable`, `metadata.sign.algorithm`, `metadata_sign_key` |
| Processing | `authproc` |

**Remodelled options**

| In the document | Core receives |
| --- | --- |
| `key`, a key slot | `privatekey`, `privatekey_pass`, `key_name`, and `certData` or `certificate` |
| `next_key`, a key slot | The same names with the prefix `new_`, published in the metadata beside the current certificate |
| `metadata_sign_key`, a key slot | The `metadata.sign.` options |
| `https_certificate`, a certificate | `https.certData` or `https.certificate` |
| `SingleSignOnService`, `SingleLogoutService`, hosted endpoints | `SingleSignOnService` or `SingleLogoutService` as a URL string when `Location` is set, and `SingleSignOnServiceBinding` or `SingleLogoutServiceBinding` as a list |
| `NameIDFormat`, `scope`, always lists | The list |
| `OrganizationName`, `OrganizationDisplayName`, `OrganizationURL`, always language maps | The map |
| `attributes`, `attributeencodings`, `contacts`, `EntityAttributes` | As in sections 5.5 and 6.7 |
| `authproc` | As in section 6.7 |

`auth` carries `x-authsource-reference` and is checked at Publication (section 5.8). The rules for Key references, the next key and Promote are in section 7.

**Rules.** The first two are in the schema, the third in the class.

- `OrganizationName` without `OrganizationURL` is rejected; core throws on it.
- `metadata.sign.algorithm` or `metadata_sign_key` without `metadata.sign.enable` set to `true` is rejected; core ignores them with an error in the log. Both carry an `x-when` on `metadata.sign.enable`.
- No two rows of `attributes` or `attributeencodings` share a `name`.

`host` is compared byte for byte for the duplicate check of section 5.8; the Console does not check its form.

**Left out.** `encryption.blacklisted-algorithms`, which the code does not read for this set, and `AttributeNameFormat` go to `extra` when present. `saml:Extensions` holds PHP objects and fits neither the document nor `extra`: a hosted IdP that needs it stays in a flat file.

### 5.14 PHP text and XML

The edit screen shows a managed entity either as a form or as the `$metadata['<entity ID>'] = [...];` statement an administrator would write in a flat file. The text is produced by the translator with Secret references unresolved and is never stored. Reading it back, reading PHP or XML pasted into "Add entity", Import and "Replace from…" all go through the inverse translator of the set; XML is first parsed with `SAMLParser`. The editor, its sentinel for sensitive values and its errors are specified in section 10.11; Import, creation from pasted configuration and "Replace from…" in section 9. See [ADR 0010](docs/adr/0010-php-view-through-inverse-translators.md).

What is specific to entities:

- A key the set does not catalog goes to `extra`, with a non-blocking warning and a suggestion when it is close to a cataloged option. That includes every option listed as left out in sections 5.11 to 5.13, except `saml:Extensions`, which the literal-only reader cannot read (section 10.11).
- A block whose entity ID differs from the entity being edited is rejected. An `entityid` key inside the array must match it too; `entityid`, `metadata-set` and `metadata-index` are then dropped.
- `expire` is dropped and reported. `url`, which `SAMLParser` writes beside `OrganizationURL`, is dropped without a report.
- An empty list or map counts as unset. `SAMLParser` writes several: `SingleLogoutService`, `ArtifactResolutionService`, `NameIDFormats`, `contacts`, empty members of `UIInfo`.
- The inverse translator accepts each form core accepts for a cataloged option and returns the single form of the document: a string where core takes a string or a list becomes a list of one; a plain localized string becomes a language map with the language `en`; a filter given as a class name string becomes `{class}`; a Unix timestamp in `RegistrationInfo.instant` becomes a UTC date-time string.
- In a remote set, `keys` becomes `certificates`. A `certData` becomes a certificate with `use: both`; a `certificate` file or `pdo://` location is read through core on the node serving the Console and stored pasted. A `keys` entry whose type is not `X509Certificate`, or that is neither for signing nor for encryption, is an error.
- In `saml20-idp-hosted`, and in `signature_key` and `metadata_sign_key`, `certData` becomes a pasted certificate and a `certificate` file location a file reference; a `pdo://` location is read through core on the node serving the Console and stored pasted. `keys` and `new_keys` are rejected with an error that names the key and points to `certData` or `certificate`, as for `saml:SP` (section 6.16): a `keys` list can hold several certificates and never carries the private key.
- A private key at a `pdo://` location is an error the administrator fixes in the editor; Import skips such an entity.

### 5.15 Accepted gaps

- No `saml:Extensions` on a hosted IdP.
- `NameIDPolicy` of a remote IdP has no effect in core 2.5 and is not cataloged.
- `skipEndpointValidationWhenSigned` cannot be a callable.
- A key descriptor with more than one certificate yields only the first, as `SAMLParser` does.
- Options written by sources other than `SAMLParser`, such as `metarefresh`'s `entityDescriptor` or `tags`, were not surveyed and land in `extra`.
- The Console checks `auth` and processing filter classes against the publishing node only. Keeping modules and File authsources identical across nodes is the deployment's job (section 2.8).

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
| No | Enabled, but left out of this node's build or dropped by `merge()` | Nothing, on this node only | The node's row is flagged; the reason is on the Nodes screen served by that node |
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
- **`$ref`.** Only to files of the catalog, resolved by the server and, for the form, at build time.
- **Messages.** Every `pattern` carries its own message in `$error`.

The annotations the Console adds:

| Annotation | On | Meaning |
| --- | --- | --- |
| `x-sensitive: true` | A string | A sensitive value (section 6.8) |
| `x-literal: true` | A string without an `enum` | The value refuses a Secret reference, because the Console compares it or core needs it before secrets are resolved (section 6.8) |
| `x-authsource-reference: true` | A string | The value is the id of another authsource. Publication checks it without knowing the type (section 6.9), and the form renders it as a select of the ids the API gives. |
| `x-groups` | The root | A list of `{title, properties}`. Every root option belongs to exactly one group. |
| `x-widget` | Any property | `radio`, `textarea`, `suggest`, `certificate`, `key-slot` or `certificates`; otherwise the widget follows from the type. On a value that is not a string, `textarea` means the value is edited as JSON text. `suggest` on a string offers all its `examples` as suggestions. `certificate` is carried by `certificate`, `key-slot` by `keySlot` and `certificates` by `remoteCertificates` (sections 5.5 and 6.7); the node needs neither, since it knows those shapes. |
| `x-when` | A property | Names a sibling and the values of it for which the property applies. A property that does not apply is hidden, and the server drops it on save. |

`if`/`then`/`else` keeps expressing what is required; `x-when` expresses what applies. Every property a branch requires carries a compatible `x-when`. How the form uses these annotations is specified in section 10.10; see [ADR 0012](docs/adr/0012-console-ui-as-a-spa.md).

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

A slot holds both `privatekey` and `certificate`, or neither; the schema enforces it with `dependentRequired` in both directions. A key without a certificate signs, but publishes nothing the other side can verify against; a certificate without a key is published for encryption, but nothing can be decrypted. The node's check that the key matches its certificate therefore always has both pieces. A slot emits exactly one certificate form. In a next-key slot every emitted name takes the prefix `new_`. On save the Console rewrites a pasted certificate as PEM with armour and 64-character lines, so that the document is the same after a round trip through the PHP text. The rules for Key references, the next key and Promote are in section 7.

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

- only in a string that has no `enum` and no `x-literal`, and the reference fills the whole value;
- `pattern` and `format` are not applied to it;
- an integer or a boolean cannot be a Secret reference, so it cannot vary per node;
- inside the free-form configuration of a processing filter, any string may be one.

The options marked `x-literal`, because the Console compares them or core needs them before secrets are resolved: every `x-authsource-reference`; `preselect` of `multiauth:MultiAuth`; in `sqlauth:SQL2`, the `name` of each database and authentication query and the `database` and `only_for_auth` of each query; the `username` of `exampleauth:UserPass`; the `entityID` of `saml:SP`; and the `Location` of each `AssertionConsumerService` and the `SingleLogoutServiceLocation` of `saml:SP`, through the shared `url` shape.

**Sensitive values.** The options annotated `x-sensitive` are:

| Authsource type | Sensitive options |
| --- | --- |
| `saml:SP` | `privatekey_pass` of `key` and of `next_key` |
| `ldap:Ldap` | `search.password`, `priv.password` |
| `sqlauth:SQL2` | `password` of each database |
| `multiauth:MultiAuth` | none |
| `exampleauth:UserPass` | `password` of each user |

A stored literal of a sensitive option is sent only to the edit screen of its own authsource; everywhere else it is a marker (sections 7 and 10). The configuration of a processing filter is free-form, so a literal secret inside it is shown unmasked; the Console recommends a Secret reference there. The `contacts` of `saml:SP` hold personal data and are not masked.

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
- An `x-authsource-reference` whose value is neither the id of an enabled managed authsource nor the id of a File authsource of the publishing node. In the authsource schemas the only such option is `source` in `multiauth:MultiAuth`; the `auth` of `saml20-idp-hosted` carries it too (section 5.8). Deleting or disabling a managed authsource that is referenced can be saved, and it is the Publication that blocks.
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
| `AssertionConsumerService`, a list of `{Binding, Location, index?, isDefault?, hoksso:ProtocolBinding?}` | The list |
| `authproc` | As in section 6.7 |

`privatekey`, `certificate`, `certData`, `keys`, `key_name` and their `new_` forms are never options of their own.

**Rules.** The placeholder, the algorithm and the bindings of `AssertionConsumerService` are checked by the schema, the rest in the class.

- `entityID` is not core's placeholder `https://myapp.example.org/`.
- `entityID` is at most 1024 bytes, the rule of every entity ID (section 4.3). The schema has no `maxLength`, which would count characters.
- `signature.algorithm` is one of the four RSA algorithms of the schema's enum.
- `OrganizationName` without `OrganizationURL` is rejected; core throws on it.
- No two rows of `attributes` share a `name` or a `friendlyName`.
- In `AssertionConsumerService`, `Binding` is one of the three bindings core's `saml2-acs.php` handles: HTTP-POST, HTTP-Artifact and holder-of-key Web Browser SSO. `hoksso:ProtocolBinding` is optional and applies only when `Binding` is holder-of-key (`x-when`), as in what core generates from `acs.Bindings`. `ResponseLocation` is not accepted: SAML metadata forbids it on an assertion consumer service.
- In `AssertionConsumerService`, no two endpoints share an `index` and at most one is `isDefault`.
- `SingleLogoutServiceLocation` uses the shared `url` shape (section 5.5), so it refuses a Secret reference like every `Location` of an assertion consumer service.

**Left out.** `saml:Extensions` and `saml:logout:Extensions`, which are XML objects and not expressible in JSON; every `saml.SOAPClient.*` option; `NameIDFormat`, which the code does not read.

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

The edit screen shows a managed authsource either as a form or as the PHP an administrator would write in `authsources.php`: `'id' => [...],` with the type at key `0`. The text is produced by the translator with Secret references unresolved and is never stored. Reading it back, and reading PHP pasted into "Add authsource", is the work of the inverse translator of the type. The editor, its sentinel for sensitive values and its errors are specified in section 10.11; see [ADR 0010](docs/adr/0010-php-view-through-inverse-translators.md).

What is specific to authsources:

- A key the type does not catalog is an error naming the key. It is never kept aside: authsource schemas have no `extra` bag. That includes every option listed as left out in sections 6.11 to 6.15.
- A block whose id or whose type differs from the authsource being edited is rejected. In "Add authsource" the type is read from key `0`, and a type outside the five stops there.
- The inverse translator accepts each form core accepts for a cataloged option and returns the single form of the document: a string where core takes a string or a list becomes a list of one; a plain localized string becomes a language map with the language `en`, which is how core reads it; `search.*` and `priv.*` keys are gathered into their objects; an absent `attributes` of `ldap:Ldap` becomes `mode: none` and a `null` one `mode: all`.
- `certData` becomes a pasted certificate, and a `certificate` location a file reference.
- `keys` and `new_keys` are rejected with an error that names the key and points to `certData` or `certificate`. A `keys` list can hold several certificates with their own `signing` and `encryption` flags and never carries the private key, so mapping it onto a slot would drop information silently.
- In `exampleauth:UserPass` the password sits in the key, so the sentinel of a stored password is part of the key and renaming the user in the text means retyping the password.

### 6.17 Accepted gaps

- No client certificate for Artifact resolution or SOAP logout: `saml.SOAPClient.*` is not cataloged.
- No PDO driver options for `sqlauth:SQL2`, so a custom CA towards the database needs a File authsource.
- No `saml:Extensions` on the requests of a `saml:SP`.
- The Console checks references and modules against the publishing node only. Keeping File authsources and modules identical across nodes is the deployment's job (section 2.8).

## 7. Keys and secrets

### 7.1 Values

A string value of a Console document is either a literal, stored in clear in the database, or a Secret reference, which each node resolves from its own environment. The Console has no encryption key of its own; see [ADR 0001](docs/adr/0001-no-application-level-encryption-of-secrets.md).

A private key is never a value of a document. It is always a file that each node provides, and the document holds a Key reference to it. A certificate is either held by the Console as pasted PEM or referenced as a file.

### 7.2 Secret references

| Form | Resolves to |
| --- | --- |
| `%secret(name)%` | The contents of the file `name` in the node's `secrets_dir` (section 2.3). `name` contains no `/`. |
| `%env(CONSOLE_NAME)%` | The value of the environment variable `CONSOLE_NAME`. The `CONSOLE_` prefix is mandatory; any other name is rejected on save. |

- A Secret reference fills the whole value. There is no interpolation inside a longer string.
- Where a Secret reference is accepted is set by the schemas: only in a string without an `enum` and without `x-literal`, and anywhere inside the configuration of a processing filter; never inside `extra`, in an integer or in a boolean (sections 5.7 and 6.8).
- `%secret()%` is the recommended form for secrets. `%env()%` serves deployments without mounted secrets, and values that vary per environment without being sensitive.
- In a private key or certificate file reference only `%env()%` is accepted, and it must resolve to a path (section 7.4).
- When a node resolves `%secret(name)%`, every trailing `\r` and `\n` of the file is stripped, and no other whitespace is touched, so that a file written with `echo` works. A secret therefore cannot end with a line break.

**Resolution.** Only a node resolves Secret references, when it builds its local copy of a Snapshot (section 3.5), never during an SSO request. The Console stores a Secret reference as it is, carries it unresolved in the Snapshot and the Audit trail, and shows it as plain text everywhere.

- A reference that does not resolve on a node leaves the object that holds it out of that node's build. The rest of the Snapshot is served (section 11.3).
- On every `cron` check the node resolves the references of the current Snapshot again and writes a new build only when the result differs. A rotated secret needs no Publication and takes effect within one `cron` cycle.

**Editing aid.** The node serving the Console offers the file names in its `secrets_dir` for completion, never their contents. A reference that does not resolve on that node is a warning on save, never a block: the Console cannot check the other nodes.

### 7.3 Sensitive values

The options annotated `x-sensitive` are listed in sections 5.7 and 6.8. A literal stored in one of them is a sensitive value.

- It is sent to the browser only by the edit screen of its own object: in the form, in a password field with a reveal control; in the PHP view, as a fixed sentinel that a Reveal request to the server replaces with the value (section 10.11). The raw view of an Unreadable row (section 10.8) counts as that edit screen and shows the stored bytes as they are.
- An unsaved editor, such as a managed copy or an object created from pasted configuration, is the edit screen of the object that will hold the value, so it carries the value to the browser: in the form, in a password field; in the PHP view, as it is, with no sentinel. In its API requests the value travels like any other field.
- Every API response above, and every response of an unsaved editor, is served with `Cache-Control: no-store`. The browser keeps the value in memory only.
- In the form an empty field means an empty value. In the PHP view a sentinel left untouched keeps the stored value; a sentinel anywhere other than its own option is an error.
- Everywhere else it is a marker: lists, Pending changes and the Publication and Rollback diffs, the Audit trail, logs, `cron` summaries and node status. In a diff and in the Audit trail the marker says only whether the value changed.
- A Secret reference in a sensitive option is not a sensitive value and is shown as it is.

Values outside the catalog of sensitive options are never masked: the configuration of a processing filter, `extra`, contacts. When the Console finds what looks like a secret in clear in pasted configuration, it suggests a Secret reference and does nothing else.

Literal secrets are in clear in the edit tables and in every retained Snapshot, and resolved secrets are in clear in the node's build files, which are readable by the web server user only. Retention of Snapshots is bounded for this reason (section 4.10). The resulting risks are accepted in section 1.6.

### 7.4 Key references

**Where they are.**

| Object | Key slots | Certificates |
| --- | --- | --- |
| `saml20-idp-hosted` | `key`, `next_key`, `metadata_sign_key` | `https_certificate` |
| `saml20-sp-remote`, `saml20-idp-remote` | `signature_key` | `certificates`, a list of pasted certificates |
| `saml:SP` | `key`, `next_key` | |

A key slot (section 6.7) holds a private key reference, its passphrase, one certificate and a key name. It holds both the private key and the certificate, or neither.

**Private key.** The `privatekey` of a slot is one of:

- a name relative to the node's `certdir`;
- an absolute path, such as `/run/secrets/idp.key`;
- `%env(CONSOLE_NAME)%`, resolving to either of the above.

A `pdo://` location and a `%secret()%` reference are rejected on save: the first would make SSO query the database, the second would put key material where core expects a path. The Console never uploads, generates or stores a private key. Its passphrase, `privatekey_pass`, is a sensitive value.

**Certificate of a key slot.** Either pasted PEM held by the Console, which is the recommended form and is emitted as `certData`, or a file reference in the same forms as a private key, emitted as `certificate`. On save a pasted certificate is rewritten as PEM with armour and 64-character lines.

**Certificates of a remote entity.** Always pasted, each with its use: `signing`, `encryption` or `both`. They are never file references; only the `signature_key` slot of a remote entity refers to files. The list is emitted as core's `keys` (section 5.5).

**One form per slot.** A slot emits exactly one certificate form. Core reads `keys`, then `certData`, then `certificate`, and silently ignores the lower ones when a higher one is present; the Console never emits two.

### 7.5 Checks

**On save**, on the node serving the Console:

| Blocks | Warns |
| --- | --- |
| Pasted PEM that is not a valid certificate | A key or certificate file that is missing or unreadable |
| A `pdo://` location in a file reference | A private key that does not match its certificate |
| `%secret()%` in a file reference | A certificate that has expired or expires within `cert_expiry_warning_days` |

**On a node**, when it builds its local copy, for every Key reference: the file exists and is readable, the private key opens with its passphrase, and it matches the certificate of its slot.

- `next_key` fails: only that slot is left out of the build; the object is served with its current key.
- Any other slot or certificate fails: the whole object is left out of that node's build.
- Either way the node records the reason and sets its flag (section 11.3).

An expired certificate is never a reason to leave an object out.

### 7.6 Expiry

The Console shows the expiry date of every pasted certificate and flags those that have expired or expire within `cert_expiry_warning_days`, 30 by default: on the entity list, on the edit screen and on the Overview. For a certificate file it shows only what the node serving the Console can read. There is no email or other notification.

### 7.7 Key rollover

`next_key` models core's rollover mechanism. Its fields are emitted with the prefix `new_`. While it is set, core keeps signing with the current key, tries the next key first when decrypting, and publishes both certificates in the metadata.

A rollover goes like this:

1. The new key and certificate are made outside the Console, and the private key file is deployed to every node.
2. The administrator fills `next_key` and publishes. Partners pick up the new certificate from the metadata.
3. When partners are ready, the administrator runs **Promote** on the object. It moves the next key into the current slot and empties `next_key`. Its confirmation warns that the previous key leaves the configuration and that messages encrypted to the old certificate will no longer decrypt.
4. Promote is an edit like any other: it is a Pending change, takes effect at the next Publication, and is recorded in the Audit trail as `edit`.

A remote entity has no next-key slot: its rollover is a second certificate in `certificates`, removed later.

For reference only, a key pair for a slot can be made with:

```sh
openssl req -x509 -newkey rsa:3072 -sha256 -days 3650 -nodes \
    -subj '/CN=idp.example.org' -keyout idp-next.key -out idp-next.crt
```

## 8. Workflow

### 8.1 Saving

A save writes the Console's edit tables and nothing else. Nodes keep serving the current Snapshot until a Publication.

- An object is saved only when it is valid on its own (sections 5.7 and 6.8). There are no invalid drafts.
- Every save carries the `version` the form was loaded with and is rejected when the object changed meanwhile (section 4.8).
- Every save writes its row of the Audit trail in the same transaction (section 8.7).

The operations on a managed entity or a managed authsource are create, edit, enable, disable, delete, discard and, on an object with a `next_key`, Promote. Each one is a save.

- Deleting an object removes its row. Deleting or disabling a managed authsource that another object references can be saved; it is the Publication that blocks (sections 5.8 and 6.9).
- Disabling or deleting an Override warns that nodes will serve the External entity again after the next Publication (section 9.3).

### 8.2 Pending changes

There is no state column. The state of each object is computed by comparing what is saved with the current Snapshot:

| In the current Snapshot | Saved | State | Pending change |
| --- | --- | --- | --- |
| No | Enabled | Unpublished | Yes |
| No | Disabled | Not live | No |
| Yes | Enabled, same document | Up to date | No |
| Yes | Enabled, different document | Modified | Yes |
| Yes | Disabled | To be withdrawn | Yes |
| Yes | Deleted | Deleted | Yes |
| Either | Enabled, and the row cannot be loaded | Unreadable | Yes |

- Before the first Publication every enabled object is Unpublished, imported ones included.
- Editing or deleting an object that is disabled and absent from the Snapshot produces no Pending change.
- "To be withdrawn" and "Deleted" are shown apart, although nodes see the same thing.
- The `enabled` column stays readable when `document` does not load, so a disabled row that cannot be loaded gets its state as any disabled row, Not live or To be withdrawn, and carries the label "Unreadable".
- After a Rollback, Pending changes are computed against the Snapshot that became current.

Every Console screen except the state pages of section 10.5 shows the number of Pending changes (section 10.3).

### 8.3 Discarding

Discarding restores an object from the current Snapshot:

| State | Discard |
| --- | --- |
| Modified | The document returns to its published version |
| To be withdrawn | The object returns to its published version, enabled |
| Deleted | The object is created again from the Snapshot |
| Unpublished | The object is disabled; it stays saved as Not live |
| Unreadable | The row is rewritten from the Snapshot; when the object is not in it, the row is disabled and stays saved as Not live with its bytes (section 11.4) |

"Discard all" does the same for every Pending change, so it leaves no Pending changes; disabled objects stay saved. A discard never deletes anything. A discard is a save: it increments `version` and leaves one `discard` row in the Audit trail per object.

### 8.4 Publication

A Publication has a confirmation screen and a confirming request.

**The confirmation screen** shows:

- the Pending changes, grouped by state, each with a line diff of its PHP text against the current Snapshot, sensitive values as markers (section 7.3), except an Unreadable row, which shows its load error;
- the problems that block, each naming its object;
- the warnings: those of section 5.9 for the entities with Pending changes, and every warning of sections 5.8 and 6.9, collisions with External entities included (section 9.3);
- an optional comment.

Warnings need no separate acknowledgement. Publication is not offered when there are no Pending changes or when anything blocks. The screen carries a hash of the Pending changes, made of their keys and `version` values.

**What is checked.** Every enabled managed entity and managed authsource is validated again, not only those with Pending changes, against the schemas and rules of the code that publishes, followed by the checks across objects of sections 5.8 and 6.9 and, on MariaDB and MySQL, the size of the Snapshot (section 4.9). A document that no longer passes, for example after a module update tightened its schema, blocks until it is fixed or disabled.

**The confirming request** runs the transaction of section 4.8: it compares the hash, revalidates, takes the next number, stores the Snapshot with its format version, checksum, comment, time and identity, makes it current, and writes the `publish` row of the Audit trail. It then purges Snapshots beyond retention (section 4.10).

- A hash mismatch, a lost race or a new blocking problem shows the confirmation screen again with the current state. Nothing is written and nothing is recorded in the Audit trail.
- After the commit, the node serving the request builds the new Snapshot within that request (section 3.5). The other nodes fetch it on their next `cron` check. The interface stays on Publish and shows "Snapshot #N is published", the number of changes it carried and the nodes as read from the Node table (section 10.14).

### 8.5 Rollback

A Rollback makes another retained Snapshot the current one, earlier or later than the current, so a Rollback can itself be undone. It creates no Snapshot and gives no number.

**The confirmation screen** shows the difference between the current Snapshot and the target, as PHP text with sensitive values as markers. It warns, without blocking, when the target holds a managed authsource whose type's module is not installed and enabled on the node serving the request.

**Checks.** Only the target's checksum and format version. A checksum that does not match, or a format version above what the code knows, blocks the Rollback. The content is not validated again.

**The confirming request** moves the pointer with the conditional update of section 4.8 and writes the `rollback` row of the Audit trail. A lost race shows the confirmation screen again. The node serving the request then builds the target within that request, always, even when it still holds a build of that number, because secrets may have rotated. The other nodes follow on their next `cron` check.

**The edit tables are untouched.** Pending changes do not block a Rollback. What was saved stays saved and shows as Pending changes against the Snapshot that became current; a faulty change is then fixed and published under a new number, or dropped with "Discard all".

### 8.6 Retention

The database keeps `snapshot_retention` Snapshots, 10 by default, and a Rollback can target only those (section 4.10). The Audit trail keeps the `publish` row of every Snapshot, comment included, after the Snapshot itself is purged.

### 8.7 Audit trail

The table and its rules are in section 4.4. Each operation leaves these rows:

| Operation | `action` | Rows |
| --- | --- | --- |
| Create, including saving pasted configuration (section 9.6) | `create` | One per object |
| Edit, including Promote and a save from the PHP view | `edit` | One |
| Enable, disable, delete | `enable`, `disable`, `delete` | One |
| Discard, one object or all | `discard` | One per object |
| Import from External entities (section 9.5) | `import` | One per entity created |
| Mark an Override as reviewed (section 9.4) | `reviewed` | One |
| Publication | `publish` | One, with the Snapshot numbers and the comment |
| Rollback | `rollback` | One, with the Snapshot numbers |
| Migration run | `migrate` | One, after the run |

The identity of each row is the first value of the `useridattr` attribute of the `admin` session, or the constant `admin` (section 2.3). When the identity of the current session is the constant `admin`, the Audit trail screen says, without blocking, that changes are recorded without saying who made them.

The difference shown for a row is computed on display, against the previous row of the same object. A document that the current translator cannot translate, such as one recorded before a module update, is shown as raw JSON.

## 9. External entities, Override and Import

### 9.1 Reading External entities

An External entity is read live, at request time, from the `metadata.sources` of the node serving the Console: every entry other than `console:Snapshot`, for the three managed sets only. Nothing about External entities is copied into the database or indexed. Reading a large source on every request is an accepted cost.

- Each source is read on its own. A source that throws is shown as unreadable, with its error, and the other sources are still listed.
- Each External entity is labelled with its source: its type and its location. The Console does not tell a hand-written file from one written by `metarefresh`.
- An expired External entity is shown, marked as expired.
- The Console assumes every node has the same `metadata.sources` (section 2.8) and never compares them.

**Sensitive options.** The sensitive options of the set (section 5.7) are always masked with the marker on an External entity, with no reveal control: an External entity has no edit form, and a sensitive value reaches only the edit form of the object that holds it. The catalog is applied to the root keys of the array core returns. A managed copy or an Import copies the value, which can then be revealed in the copy's edit form.

**`console:Snapshot` missing.** When `console:Snapshot` is not in `metadata.sources`, managed entities are served by none of the node's sources. Each node detects it when it builds and reports it as a node problem (section 3.5). When the node serving the Console lacks the entry, Overview and the entity lists also show a warning, because the Override and Shadowed labels of section 9.3 are then meaningless. Nothing is blocked.

### 9.2 The External entities screen

A read-only screen of its own, separate from the lists of managed entities.

- Entities are grouped by source and set, paginated on the server, and searchable by entity ID and name.
- An External entity that is already a managed entity of the same set is marked as such.
- The detail view lists every copy of the entity held by the node's sources, in source order, and marks the one the node serves. Each copy is shown as core receives it, as PHP written with `VarExporter::export` (section 3.7), with its sensitive options masked (section 9.1), and offers "Create managed copy" (section 9.5).
- Sources of type `flatfile` and `pdo` also offer Import (section 9.5).

### 9.3 Collisions: Override and Shadowed

A collision is a managed entity that shares entity ID and set with an External entity. Which one a node serves is decided by the order of `metadata.sources`: the first source holding the entity ID wins, for single lookups and for listings. The Console never decides it; it reports it, according to the `config.php` of the node serving the page:

- **Override**: `console:Snapshot` comes before the External entity's source. Nodes serve the managed entity, and it no longer follows changes made in the source.
- **Shadowed**: the source comes first. Nodes serve the External entity.

Collisions never block a save or a Publication.

- The list of managed entities marks the collisions of its own rows; the edit screen says which applies.
- The Publication confirmation lists as warnings: new Overrides, Shadowed managed entities and Overrides whose source has changed (section 9.4).
- Disabling or deleting an Override warns that nodes will serve the External entity again after the Publication.
- When the External entity disappears from its source or expires, an Override keeps being served and the Console says so. Nothing is withdrawn automatically.

Two behaviours of core are worth knowing when reading these labels:

- A single lookup that finds an expired entity in the first source holding it throws instead of falling through. A Shadowed managed entity whose External entity has expired is therefore not served either.
- A `saml20-idp-hosted` is chosen by `host` before it is fetched by entity ID, and a match on host and path outranks a match on host alone, which outranks `__DEFAULT__`, whatever the source order. A managed hosted IdP can lose to an External one with a different entity ID; the Console warns when they share a `host` (section 5.9).

### 9.4 Following the source of an Override

An Override stores the fingerprint of the External entity it collides with, in `external_fingerprint` (section 4.4). It is stored only by a POST: saving a managed copy, an Import, or **Mark as reviewed**. Nothing stores it when a collision is first displayed, since that is a GET and taking the first version seen as the baseline would accept it unseen.

**The fingerprint** is the SHA-256, in lowercase hex, of the External entity's array as core receives it, normalised:

- the keys of every map are sorted; the order of lists is kept;
- these keys are left out at the top level, because they do not describe the entity: `expire`, `metarefresh:src`, `entityid`, `metadata-set` and `metadata-index`.

**When it differs** from the current one, the Override is flagged "external source changed"; when it is null, as for an entity created by hand that came to collide, "external source not reviewed". Either flag is shown on the entity list, on its edit screen, on the Overview and on the Publication confirmation, and leads to a comparison of the current External entity with the managed one, as PHP text with the keys above hidden, and to **Mark as reviewed**, which stores the current fingerprint and writes a `reviewed` row of the Audit trail.

The fingerprint is edit-side state. Storing it does not change `version`, is not a Pending change and does not travel in the Snapshot. It is compared only when the administrator looks: on the entity list, the edit screen, the Overview and the Publication confirmation. There is no background check and no notification.

### 9.5 Managed copy and Import

**Managed copy.** The detail view of any External entity offers "Create managed copy". It opens the editor of the entity's set filled with the entity, unsaved, with the report of section 9.6, and warns that the copy stops following its source. Saving it is a `create` like any other.

The copy carries the External entity's sensitive values to the browser (section 7.3): its editor is the edit form of the object that will hold them. Saving does not read the source again.

**Import** is the same operation applied to many External entities at once.

- It is offered only for sources of type `flatfile` and `pdo`, as checkboxes on the External entities screen. Entities of `serialize`, `xml` and `mdq` sources are copied one at a time.
- Nothing is ticked by default. Each source has a "select all" that covers the whole source, not only the visible page.
- An External entity that is already managed in the same set cannot be ticked. Import never overwrites a managed entity.
- A confirmation step precedes it and lists only the ticked entity IDs. The Import request reads the sources again on the server, so no sensitive value reaches the browser. It can be repeated at any time.

Each ticked entity goes through the inverse translator of its set (section 5.14) and the validation of a save (section 5.7), and is saved on its own as an enabled, Unpublished managed entity, with its fingerprint. One that fails is skipped with its reason. Import never runs a Publication. Each entity created leaves one `import` row in the Audit trail.

**Conversions**, applied by Import and by a managed copy alike:

| Found in the External entity | In the managed entity |
| --- | --- |
| `expire` | Dropped, and reported |
| An option the set does not catalog | Moved to `extra`, and reported |
| An endpoint whose binding core does not use for its service | Kept as it is |
| Private key of a `saml20-idp-hosted`, or of the `signature_key` of a remote entity, in a file | A Key reference to the same file |
| Private key at a `pdo://` location | Import skips the entity, saying the key must move to a file; a managed copy shows it as an error in the editor |
| Certificate of a remote entity (`keys`, `certData`, `certificate`) in a file or at a `pdo://` location | Read through core on the node serving the Console and stored pasted, and reported; if it cannot be read, Import skips the entity and a managed copy shows an error |
| Certificate of a `saml20-idp-hosted`, or of the `signature_key` of a remote entity, in a file | A file reference |
| Certificate of a `saml20-idp-hosted`, or of the `signature_key` of a remote entity, at a `pdo://` location | Stored pasted, and reported |

**The report** is the message on External entities, where the interface returns after the Import (section 10.1). It lists, per entity, whether it was imported or skipped with its reason, and the conversions applied. Per source, it lists the entity IDs the administrator may now remove from the original by hand. When a source comes before `console:Snapshot` in `metadata.sources`, it says prominently that the entities imported from it are Shadowed, and that publishing changes nothing nodes serve until the originals are removed.

**Originals.** The Console deletes nothing: no file, no row of the core PDO tables. Until the administrator removes them, the originals remain External entities in collision with the warnings of section 9.3.

File authsources cannot be imported (section 6.3).

### 9.6 Creating from pasted configuration

The Add action of each entity list ("Add service provider" and the like) and "Add authsource" start from one text area:

- metadata XML or PHP for an entity, PHP for an authsource. The format is detected and the administrator can correct it;
- "Start empty" beside it, and for entities a link to External entities;
- "Upload" reads a local file into the text area in the browser. The server never receives an upload;
- the input is capped at 1 MiB; the error points to `metarefresh` for federation aggregates.

There is no fetch from a URL and no export format. PHP is the interchange format between Consoles: Download `.php` in one, paste in the other. The enabled flag does not travel.

**Entities.** XML is parsed with `SAMLParser`, PHP with the reader of section 3.7, and both go through the inverse translator of the set (section 5.14).

- XML that describes another kind of entity offers to switch to its set. An entity descriptor with both roles yields the role of the set being added to.
- Keys and certificates follow the conversions of section 9.5, except that nothing discards the object: an unreadable certificate file or a `pdo://` private key is an error the administrator fixes in the editor.

**Authsources.** The type is read from key `0`. A type outside the five Authsource types stops there (section 6.16).

**One object.** The editor opens filled and unsaved, held by the browser, with a report panel above it: what was converted, what was moved to `extra`, what was ignored. What needs the administrator shows as validation errors. Nothing is saved until the administrator saves.

**Several entities**, from an `EntitiesDescriptor` or several `$metadata[...]` statements, give a selectable list. Entities already managed in the set cannot be selected; those colliding with an External entity are marked as future Overrides or Shadowed (section 9.3). One selected entity opens in the editor as above. Several are saved on their own as Pending changes, invalid ones and those that already exist skipped with their reason, and the interface moves to the entity list of the set with a report like that of section 9.5. Each is recorded as `create`: creating from pasted configuration is not Import.

When pasted configuration holds what looks like a secret in clear, the Console suggests a Secret reference.

### 9.7 Replace from…

"Replace from…" on an existing managed entity takes metadata XML only.

- The entity ID must match.
- It merges: every option the XML yields for the set (endpoints, certificates, NameID formats, names and the like) is overwritten, and removed when the XML no longer carries it. Everything else, such as `authproc`, the attribute policy and `extra`, is untouched.
- The result opens in the editor unsaved, with the report of section 9.6 and no diff screen of its own.

Replacing from PHP is pasting over the text of the PHP view. Authsources have no "Replace from…".

## 10. Console UI

This section specifies what the administrator sees and the requests behind it. The branches [`prototype/console-ui`](https://github.com/sgomez/simplesamlphp-module-console/tree/prototype/console-ui/prototype/console-ui) (a design export of every screen, light and dark, with `console.css`) and [`prototype/authsource-form`](https://github.com/sgomez/simplesamlphp-module-console/tree/prototype/authsource-form/prototype/authsource-form) (the form over three authsource schemas; its Twig rendering is superseded by section 10.17) illustrate it. The boards of `prototype/console-ui` are normative: the tokens and component classes of its `console.css`, and the layout, wording and components of its boards, light and dark. When a board and this section disagree, the board wins and this section is changed to match. The implementation does not depart from a board unless the maintainer decides so, and such a decision is recorded here. Where a board is missing for a screen or state, or a board needs a capability the product lacks, the maintainer decides before it is built. The boards' webfonts and inline styles are artefacts of the design tool and are not adopted.

**Fundamental rule: a clean interface.** The UI shows data, labels and actions, and nothing that explains what is obvious from them. A sentence appears only when the administrator cannot act correctly without it: an error, a warning about the configuration, or a confirmation of an action that cannot be undone. No sentence restates what a control does, what just happened when the page already shows it, or how the Console works internally. When in doubt, leave it out.

### 10.1 Rendering

- The interface is a single-page application in React and TypeScript, built with Vite. One page shell serves it on every Console path, and every screen gets its data from the JSON API of section 10.4. See [ADR 0012](docs/adr/0012-console-ui-as-a-spa.md).
- JavaScript is required. The front end is specified in section 10.17.
- Every page passes core's default Content Security Policy (section 3.8): no inline scripts or styles, no `style` attributes, no inline event handlers, nothing from another origin, no `eval`. Icons are inline SVG.
- A state-changing request is an API POST. When it succeeds, the interface moves to the screen that follows, with no exception, and that screen shows the outcome as a one-shot message. A result, such as the report of an Import, is that message; there are no result screens. After a Publication, the screen that follows is Publish itself (section 10.14). When it is rejected, the screen stays as it was, with what the administrator entered, and shows the errors.
- A request that gets no answer, or an answer the screen does not expect, such as a 500, leaves the screen as it was with an error callout that names what did not happen: "Not saved: the Console could not be reached." or "Not saved: the server answered 500.", and likewise "Not deleted", "Not published" and "Migrations not run".
- While a screen's data loads, its content shows the skeleton of the design system: a card of placeholder rows that does not animate.
- Some API POSTs save nothing: translating between the form and the PHP view, validating while editing, Reveal, reading pasted configuration or "Replace from…", and the Import confirmation step. They leave no row in the Audit trail.
- The Console is English only. It has no translations, and option titles, help texts and error messages are written in the module.

### 10.2 Page shell

Console pages are served by one shell template of the module that does not extend core's `base.twig`. See [ADR 0012](docs/adr/0012-console-ui-as-a-spa.md).

- The shell answers every GET under `module.php/console/` that is not under `api/` or `assets/`, after `requireAdmin()`. The client router resolves the path, so every URL of section 10.4 can be bookmarked and reloaded.
- It sets `lang="en" dir="ltr"` on the root element whatever the site's language cookie says, and its own `<title>`, favicon, `robots` (no indexing) and viewport lines.
- It loads the entry script and the stylesheet named by Vite's manifest only: not core's stylesheet, not core's script, not the deployer's `_head.twig`. It carries the request-forgery token in a `<meta>` element and holds no other markup.
- Fonts are system font stacks, a sans-serif for the interface and a monospace for entity IDs, authsource ids, option names, URLs, file paths and PHP. The module ships no font files.
- Colours follow the system's light or dark setting through CSS custom properties.
- The layout is a sidebar on the left, a header and one content column. Below a width of 900 px the sidebar becomes an overlay opened from a button in the header. At 600 px and below, phone width, some screens shorten their labels, as stated where they apply.
- The header holds a breadcrumb and the Pending changes indicator (section 10.3).
- The foot of the sidebar shows the identity of the session (section 10.6) and logout, through `Utils\Auth::getAdminLogoutURL()`. The sidebar's System group links to three pages of core's admin module (section 10.3). Admin entries of other modules are not listed; `Menu::insert()` is not used. There is no language selector (section 1.2).
- The Console renders the same under any installed theme.

The Console is reached from core through a link "Console" on core's Configuration tab, added by a `ConfigPageEvent` listener (section 3.2). That listener never queries the database.

### 10.3 Navigation

The sidebar has these entries, in this order:

| Group | Entry | Screen |
| --- | --- | --- |
| | Overview | Section 10.7 |
| Entities | Service providers | List of managed `saml20-sp-remote` (section 10.8) |
| | Identity providers | List of managed `saml20-idp-remote` |
| | Hosted IdP | List of managed `saml20-idp-hosted` |
| | External entities | Section 10.13 |
| Login | Authsources | Section 10.8 |
| Changes | Publish | Section 10.14 |
| | History | Section 10.15 |
| | Nodes | Section 10.16 |
| System | Configuration | Core's Configuration page |
| | Test authentication | Core's Test authentication page |
| | Federation | Core's Federation page |

Service providers, Identity providers, External entities and Authsources carry the number of objects they list, and Nodes the number of nodes. The System entries leave the Console.

Screens without an entry of their own: the edit screen, the Add screens, the detail of an External entity, the Override comparison, the Import confirmation and result, the Rollback confirmation and the state pages of section 10.5.

**Pending changes indicator.** The header of every screen carries a button "Review N changes" leading to Publish, where N is the number of Pending changes (section 8.2), and the Publish entry of the sidebar carries the same count as a badge. At phone width the button shows the count only. With no Pending changes the button is not shown. On the Publish screen the header shows "Live: Snapshot #N", the current Snapshot's number without its time, instead of the button; before the first Publication it shows nothing.

The set of an entity is shown by its friendly name with the set name beside it in monospace: Service providers (`saml20-sp-remote`), Identity providers (`saml20-idp-remote`), Hosted IdP (`saml20-idp-hosted`). At phone width the set name is hidden.

### 10.4 Routes

Every route is declared under `routing/routes/` and served by an autowired controller (section 3.2). All paths are under `module.php/console/`. `{set}` is core's set name, `{id}` an authsource id, `{n}` a Snapshot number (digits only).

**Screens.** Each is a GET served by the page shell (section 10.2) and resolved by the client router.

| Path | Screen |
| --- | --- |
| `/` | Overview (section 10.7); also the target of the link on core's Configuration tab |
| `/entities/{set}` | Entity list, per set (section 10.8); `q`, filters and `page` in the query string |
| `/entities/{set}/new` | Add entity, per set: the paste area of section 9.6 |
| `/entities/{set}/edit?entityid=…` | The edit screen (section 10.9) |
| `/entities/{set}/override?entityid=…` | Override comparison (section 10.13) |
| `/authsources` | Authsource list (section 10.8) |
| `/authsources/new` | Add authsource: the paste area, and the choice of type for "Start empty" |
| `/authsources/{id}/edit` | The edit screen |
| `/external` | External entities (section 10.13); `source`, `set`, `q` and `page` in the query string |
| `/external/{set}?entityid=…` | External entity, its detail |
| `/external/{set}/copy?entityid=…&source=N` | Managed copy: the editor of the set filled with the External entity, unsaved (section 9.5) |
| `/publish` | Publish, the confirmation screen (section 10.14) |
| `/history` | Snapshots, the first tab of History (section 10.15) |
| `/history/{n}/rollback` | Rollback confirmation, for one retained Snapshot |
| `/history/audit` | Audit trail, the second tab of History; filters and `page` in the query string |
| `/nodes` | Nodes (section 10.16) |

A path the router does not know shows "Not found".

**API.** Every route under `/api/` passes the checks of section 3.8 in this order: `requireAdmin()`, the state of the database (section 10.5), and, for a POST, the request-forgery token and the JSON content type (section 10.6). Run migrations is the one route that proceeds when the schema does not match the code. Bodies and responses are JSON.

| Method | Path | Does |
| --- | --- | --- |
| GET | `/api/session` | Identity, the links to core, the counts of the sidebar, the number of Pending changes and the current Snapshot (sections 10.2 and 10.3) |
| GET | `/api/overview` | Section 10.7 |
| GET | `/api/entities/{set}` | A page of the entity list and the count of each filter; `q`, filters and `page` in the query string |
| GET | `/api/entities/{set}/entity?entityid=…` | The object of the edit screen: document, PHP text, `version`, state, notices and warnings; an Unreadable row's stored bytes. Without `entityid`, the starter text of a new object, its entity ID left empty in the `$metadata[...]` line |
| POST | `/api/entities/{set}/read` | Reads pasted entity configuration: the editor's content unsaved with its report, or the selectable list of several entities (section 9.6) |
| POST | `/api/entities/{set}/create` | Saves the selected entities and returns the report (section 9.6) |
| POST | `/api/entities/{set}/save` | Create or edit, from the form or the PHP view; an edit sends the `version` it was loaded with, a create sends none |
| POST | `/api/entities/{set}/validate` | Validates the editor's content as a save would, saving nothing (section 10.10) |
| POST | `/api/entities/{set}/view` | Translates the editor's content to the other view, or returns the PHP view with sensitive values for Reveal; a switch records the view in the session (section 10.9) |
| POST | `/api/entities/{set}/{op}` | Enable, disable, delete, discard, Promote, Replace from…; `op` is `enable`, `disable`, `delete`, `discard`, `promote` or `replace` (sections 8.1 and 9.7); `replace` returns the merged document, unsaved |
| GET | `/api/entities/{set}/override?entityid=…` | Override comparison |
| POST | `/api/entities/{set}/reviewed` | Mark as reviewed (section 9.4) |
| GET | `/api/authsources` | Authsource list |
| POST | `/api/authsources/read` | Reads pasted authsource configuration |
| POST | `/api/authsources/save` | Save a new authsource; the id travels in the body |
| GET | `/api/authsources/{id}` | The object of the edit screen |
| POST | `/api/authsources/{id}/save`, `/api/authsources/{id}/validate`, `/api/authsources/{id}/view`, `/api/authsources/{id}/{op}` | As for entities |
| GET | `/api/external` | External entities |
| GET | `/api/external/{set}?entityid=…` | An External entity's detail |
| GET | `/api/external/{set}/copy?entityid=…&source=N` | The Managed copy's content, unsaved |
| POST | `/api/external/import/confirm` | The confirmation step for the ticked entities |
| POST | `/api/external/import` | Runs the Import and returns its report (section 9.5) |
| GET | `/api/publication` | The Publish screen (section 10.14) |
| POST | `/api/publication` | The confirming request (section 8.4) |
| POST | `/api/changes/discard` | Discard all (section 8.3) |
| GET | `/api/history` | Snapshots |
| GET | `/api/history/{n}/rollback` | Rollback confirmation |
| POST | `/api/history/{n}/rollback` | Roll back (section 8.5) |
| GET | `/api/history/audit` | Audit trail |
| GET | `/api/nodes` | Nodes |
| POST | `/api/migrate` | Run migrations (section 4.6) |

**Statuses.** 200 with the result; 401 without an admin session, after which the interface reloads the page so core asks for login; 403 for a missing or wrong token; 404 for an object or source position that does not exist; 409 for a lost race or a moved Publication, with the current state; 415 for a body that is not JSON; 422 for a save with errors, with every error; 503 for a database that is not ready, with its state (section 10.5).

Every object, every list with its filters and every page of results has a URL that can be bookmarked. An entity is addressed by its set and entity ID, an authsource by its id; neither is a surrogate key.

- **The entity ID is never in the path.** A GET carries it in the query string as `entityid`, URL-encoded; a POST carries it in the JSON body. An encoded `%2F` in a path is refused with a 404 by Apache's default `AllowEncodedSlashes Off` and decoded by nginx, and base64url cannot be read or edited by hand.
- **An External entity is identified by (set, entity ID).** Its detail lists every copy held by the `metadata.sources` of the serving node, in source order, and marks the one the node serves. A source is named by its 0-based position in `metadata.sources` only where one copy is meant: `source` on the Managed copy and in the body of the Import POSTs. The position is checked again on every request; when it no longer holds that entity, the answer is a 404, never another source's copy.
- **The authsource page is `/authsources/{id}/edit`**, not `/authsources/{id}`, because `new` is a valid authsource id. API paths under `/api/authsources/` do not collide for the same reason: `read` and `save` are POST only, and an authsource named `read` or `save` is read with GET. Entity paths do not collide, because `{set}` and `{op}` are closed lists.

### 10.5 State pages

After `requireAdmin()` and before anything else, every API route establishes the state of the database (section 4.7). In any state but the first it answers 503 with that state, and the interface shows its page instead of the requested screen:

| State | Page |
| --- | --- |
| Database unreachable | "Database unreachable": the Console cannot reach its database; nodes keep serving their local Snapshot. |
| SQLite older than 3.24.0 | "SQLite too old": the version found and the minimum. |
| Console older than the database | "Console older than the database": the schema version the code knows and the one the database holds, and a request to update the package on this node. No button. |
| Schema does not match the code | Pending migrations, below |

A state page takes the whole content area. The sidebar is shown, but neither the Pending changes indicator nor any count, which cannot be computed in these states. The Pending migrations page is the only one that offers an action.

**Pending migrations.** The header's crumb reads "Database update". A card titled "The database needs an update" names the module version ("The module was upgraded to 1.4."), says, when there is a current Snapshot, that nodes keep serving it ("Nodes keep serving Snapshot #41 meanwhile."), and warns that a migration cannot be undone without restoring a backup. Under it come the button "Update database" and the number of steps ("3 steps"), and below the card the list "N migrations to apply", each with its number and title.

| Run | Shows |
| --- | --- |
| Applied | The requested screen, with the one-shot message "Migrations applied: 1, 2." |
| Already up to date (section 4.7) | The requested screen, with the one-shot message "The database schema is already up to date." |
| Lost to a concurrent run (section 4.6) | The one-shot warning with the server's message, on the page the database's state then calls for |
| Failed | The page again, with the error callout "Migration N failed: <title>" and the reason in monospace; the migration it stopped at is marked "Failed" in the list, and those applied before it stay applied |

### 10.6 Access, identity and request forgery

**Access.** Every route calls `requireAdmin()`. Whoever passes it is a full administrator of the Console. There is no other role and no permission check.

**Identity.** The identity of a request is the first value of the attribute named by `useridattr` in the `admin` session, or the constant `admin` when the option is unset or the attribute is missing or empty (section 2.3). Access is never refused because of it. The identity is shown at the foot of the sidebar, and is what the Audit trail and the Snapshot record. When it is the constant `admin`, the Audit trail tab says, without blocking, that changes are recorded without saying who made them.

**Request forgery.**

- One token per SimpleSAMLphp session, made with `random_bytes()` and kept in that session. There is no Symfony CSRF component and no check of `Origin` or `Sec-Fetch-Site`.
- The page shell carries it in a `<meta>` element; the interface sends it in an `X-Console-Token` header on every API POST. No GET request changes state.
- One service of the module calls `requireAdmin()` and, after the database state check, compares the token with `hash_equals()` and requires the `application/json` content type. Every API POST goes through it. A cross-site form can set neither the header nor that content type.
- A POST without a valid token gets HTTP 403. The interface shows "Request refused" with a link back to the Console and keeps nothing of the refused request. Nothing is written to the Audit trail; a warning goes to the SimpleSAMLphp log.
- The protection is needed because the SimpleSAMLphp session cookie is `SameSite=None` by default, a setting that belongs to the deployment.
- An API-level test walks every POST route and checks that it answers 403 without a token (section 12).

**Caching.** API responses that carry a sensitive value are served with `Cache-Control: no-store`: the object of the edit screen, the response to Reveal, every response of an unsaved editor (the managed copy, a view switch, a validation, a save that fails validation, reading pasted configuration, "Replace from…") and the stored bytes of an Unreadable row. The interface keeps sensitive values in memory only, never in Web Storage.

### 10.7 Overview

The landing page. It answers whether anything needs the administrator.

- **Needs attention**, a list in which each line links to the place that deals with it: Pending changes, nodes that are behind, silent or flagged (section 10.16), certificates that have expired or expire within `cert_expiry_warning_days` (section 7.6), Overrides whose external source changed or was not reviewed (section 9.4), and, when `console:Snapshot` is missing from the `metadata.sources` of the node serving the page, a warning that the Override and Shadowed labels mean nothing on that node.
- The current Snapshot: its number, when and by whom it was published, and its comment.
- The number of managed entities per set and of managed authsources.

States: first run, with nothing managed and nothing published, leading to the Add action of each set, "Add authsource" and External entities; all clear, with nothing in the list; and things to do.

### 10.8 Lists of managed objects

**Entity list**, one per set.

- One row per managed entity of the set: its name and its entity ID, or the entity ID alone when the document has no name; its state of section 8.2 by the labels below; and labels for disabled, Override, Shadowed, "external source changed", "external source not reviewed", errors against the current schema (section 5.8), warnings (section 5.9), certificates that expire ("Certificate expires in 12 days") or have expired, and Unreadable. A row shows one label, Unreadable and "Errors" first, then the state, then warnings, and counts the rest as "+N more". "Errors" lists the errors in its tooltip. A disabled object's name is struck through. An Up to date object shows no label.
- Rows are ordered by name, or by entity ID where there is no name, 12 to a page at every width.
- Search by entity ID and name. Beside it, a segmented filter "All", "Not live" (Unpublished, To be withdrawn and Not live, section 8.2) and "With warnings", each with its count of matching rows. At phone width the filter is hidden.
- Search, filters and pagination run on the server. The pager shows the range and the total, with thousands separators: "1 to 12 of 42 service providers", Previous, "Page 1 of 4", Next; at phone width "1 to 6 of 42" and "1 of 7".
- When `console:Snapshot` is missing from the `metadata.sources` of the node serving the page, the list carries the warning of section 10.7.
- The primary action is "Add service provider", "Add identity provider" or "Add hosted IdP" (section 10.12), "Add" at phone width. A row opens the edit screen.
- With no object at all, the list shows only "No service providers yet" (or the set's equivalent), without search. A search that matches nothing shows "No service provider matches “zoom”" with "Clear search" and "Search External entities", which runs the same search there.

**State labels.** The states of section 8.2 read as follows wherever the interface shows them:

| State | List row | Save bar (section 10.9) | Publish (section 10.14) |
| --- | --- | --- | --- |
| Unpublished | "New, not published" | "Saved, not live" | "Added" |
| Modified | "Modified, not live" | "Saved, not live" | "Modified" |
| To be withdrawn | "Disabled, not published" | "Saved, not live" | "Withdrawn" |
| Not live | "Disabled" | None | Not listed |
| Up to date | None | "Published" | Not listed |
| Deleted | No row | No edit screen | "Deleted" |
| Unreadable | "Unreadable" | No save bar | "Unreadable" |

Unsaved edits on the edit screen read "Unsaved edits" in the save bar, whatever the state.

**Authsource list.**

- Managed authsources first, one row each: id, Authsource type, state and labels for disabled, Shadowed, errors against the current schema (section 6.9) and Unreadable.
- Then, under "From authsources.php", the File authsources of the node serving the page, read-only, with id and type only. A File authsource whose id is also a managed authsource is marked as the one that shadows it, and the list says that the file wins (section 6.4).
- The primary action is "Add authsource".

**Unreadable rows.** A row whose `document` is not valid JSON, or that the edit side cannot load for another reason, is listed with the label "Unreadable" and the load error on the line below it, and carries "Delete…" in place of the chevron. Enabled, it is a Pending change; disabled, it is Not live or To be withdrawn (section 8.2). Opening it shows the edit screen's header, an error callout "Unreadable" with the load error, and its stored bytes as they are, read-only, sensitive literals included, with no form and no PHP view; the page is served with `Cache-Control: no-store` (section 7.3). It offers Disable, Delete and Discard; Discard rewrites it from the current Snapshot, or disables it when the object is not in that Snapshot. It blocks Publication until it is disabled, deleted or discarded.

### 10.9 The edit screen

One edit screen serves managed entities of the three sets and managed authsources of the five types.

**Header.** The object's name (its identifier when it has none), its kind (set or Authsource type), its identifier (entity ID or authsource id) with Copy, which cannot be edited, the switch "Enabled" and "More actions". Switching "Enabled" is the enable or disable operation of section 8.1, a request of its own.

**Notices**, above the content, when they apply: the object is disabled; it is an Override, with a link to the comparison of section 10.13; its external source changed or was not reviewed; it is Shadowed, by an External entity or by a File authsource; it has warnings.

**Two views** of the same object: Settings, the form of section 10.10, and PHP, the editor of section 10.11. Switching sends the editor's content to the API, which returns the other view without saving. Text in the PHP view that cannot be read blocks the switch. A new object opens in the PHP view with its required options; otherwise the editor opens in the view last used, which the switch records in the SimpleSAMLphp session and which is lost on logout.

**Save bar.** Fixed at the bottom of the content, with the object's state by the labels of section 10.8 ("Unsaved edits", "Saved, not live" or "Published"), "Discard edits" and Save. Save is enabled only with unsaved edits. "Discard edits" is shown with unsaved edits and on an object with a Pending change, and not on a Published one. A new object, never saved, shows "Unsaved", Cancel, which leaves it, and Save.

**More actions**, a menu apart from Save: "Replace from…", on a managed entity (section 9.7); Download; "Discard changes…", offered when the object has a Pending change (section 8.3); Promote, on an object whose `next_key` is set (section 7.7); and, last and set apart, "Delete…". Delete, Discard and Promote ask for confirmation in the dialog component (section 10.17), saying what will happen. Promote says that the previous key leaves the configuration and that messages encrypted to the old certificate will no longer decrypt. Disabling or deleting an Override warns that nodes will serve the External entity again after the next Publication.

**Delete dialog.** Titled "Delete <name>?", with "Cancel" and "Delete <name>", the identifier standing for the name when there is none. Its text is "<name> is removed from the Console. Nodes keep serving it until the next Publication, which withdraws it." for an object in the current Snapshot, and "<name> is removed from the Console." for one that is not, such as an Unpublished object or an Unreadable one never published. A delete moves to the list with the one-shot message "Deleted."; a delete from an Unreadable row keeps the list's page and search.

**Saving.**

- A save sends the `version` the object was loaded with (section 4.8).
- While editing, the interface validates the content against the schema in the browser and, debounced, through the API's validate route (section 10.10). Save is never blocked by them; the server decides.
- A valid save shows the saved object on the edit screen with a success callout: "Saved. Not live yet." with "Review N changes" when the object has a Pending change, "Saved." when the save left it Published.
- A save with errors writes nothing and keeps the content on screen: the error callout "Not saved: N errors", or "Not saved: the text could not be read" with "Nothing else is checked until this is fixed." when the PHP text cannot be read, and each error at its field or line. In the Settings view a list of every error, each linked to its field, sits under the callout. Errors are those of sections 5.7 and 6.8, each located by the JSON pointer of the value it concerns.
- A save that loses a race (section 4.8) shows the object as it now stands with the error callout "Not saved: <name> changed meanwhile", which says who saved it and when ("admin saved it 2 minutes ago.") and that the unsaved edits were not kept.
- Warnings (sections 5.9, 6.8 and 7.5) look different from errors and never block. They are shown after a save and whenever the object is opened.

### 10.10 The form

The form is generated in the browser from the JSON Schema of the set or type, bundled at build time with `$ref` resolved, and edits the Console document directly. See [ADR 0012](docs/adr/0012-console-ui-as-a-spa.md).

**Groups.** The root options are rendered in the groups of `x-groups`, in that order, each as a collapsible section headed by its title and "N of M set". N counts the root options of the group that are set; M those that currently apply. An "On this page" index lists the groups with their counts of set options and of errors.

**Only what is set.** An option is set when its key exists in the document.

- Only the root options that are set are rendered. Options in the root `required` list, and options that an `if`/`then` branch currently makes required, are always rendered and cannot be unset. A new object shows only those.
- Every option that is not set is offered as an add button under its group and through the finder. Adding it fetches nothing from the server.
- Each rendered root option has a control to unset it. Unsetting removes the key on save, with no confirmation.
- Presence is the existence of the key in the document sent, never inferred from the value. A set option left empty, switched off or with no rows is saved as such and judged by the schema.
- A newly added boolean starts at the opposite of its `default`. Anything else starts empty, an `enum` with no selection.
- After a rejected save the options added before it stay on screen with their errors.
- The rule applies to root options only. A nested object or a list row renders all its fields, and there an empty optional field means absent.

**Finder.** "Find an option by name or title" searches every root option of the schema, set or not, in the browser. Choosing one that is not set adds it and moves the focus to it. An option that does not currently apply is listed disabled, with the reason. `extra` is not offered by the finder.

**Conditional options.** `x-when` on a property names a sibling and the values for which the property applies.

- An option that a branch makes required appears on its own when the sibling takes one of those values.
- An optional one that starts to apply is offered as an add button only.
- One that stops applying leaves its group and its count. If it was set, it is hidden and the server drops it on save.

**Each option** shows its `title`, its option name in monospace, its `description`, its control, and as a hint the first of its `examples` or its `default`. The `default` is never written into the document.

**Controls.** The control follows from the type, unless `x-widget` says otherwise:

| Schema | Control |
| --- | --- |
| String | Text field; a text area with `x-widget: textarea`; with `x-widget: suggest`, a text field with suggestions built from all its `examples`, free text still accepted |
| String with `enum` | Select; radio buttons with `x-widget: radio` |
| Boolean | Switch |
| Integer, number | Number field |
| Object | A subsection with all its fields |
| List | Rows that can be added, removed and moved; each row holds one control, or all the fields of an object |
| Language map | Rows of language code and text |
| Any value that is not a string, with `x-widget: textarea` | JSON text area |
| `authproc` | JSON text area |
| `extra` | JSON text area, alone in a last group "Uncataloged options", rendered only once added |
| `x-authsource-reference` | Select of the ids of the managed authsources and the File authsources of the node serving the page, given by the API |
| `x-widget: certificate` | The certificate control below |
| `x-widget: key-slot` | The key slot control below |
| `x-widget: certificates` | The certificate list below |
| `x-sensitive` | Password field with a reveal control |

A select whose values come from the same document, such as the database of a query in `sqlauth:SQL2`, is a plain text field checked by the server.

**Certificate control.** A certificate shows its source, pasted or file, and the PEM or the file reference. A valid pasted certificate shows its subject and its expiry date, flagged when it has expired or expires within `cert_expiry_warning_days`. A file the node serving the page cannot find or read is a warning of section 7.5. `https_certificate` of `saml20-idp-hosted` uses it on its own.

**Key slot control.** A key slot (section 7.4) shows the private key reference, its passphrase as a sensitive value, its certificate through the certificate control, and the key name. A private key that does not match its certificate is a warning of section 7.5.

**Certificate list.** The certificates of a remote entity (section 5.5) render as rows of PEM and use. Each valid certificate shows its subject and expiry date with the same flag as in a key slot.

**Sensitive values.** A stored literal of an `x-sensitive` option is sent in a password field with a reveal control that works in the browser. An empty field means an empty value. A Secret reference is shown as plain text and is told apart from a literal by its look. A string field that accepts a Secret reference offers for completion the file names in the `secrets_dir` of the node serving the page, given by the API, never their contents (section 7.2).

**Validation while editing.**

- The schemas are compiled with Ajv for JSON Schema 2020-12 at build time into standalone validators; the browser never compiles a schema, and the bundle holds the compiled validators but nothing of Ajv. `$error` and `x-when` are declared once as Ajv keywords. Defaults are never applied.
- Every change is checked against the schema at once. Cross-field rules, identifier checks and warnings come from the API's validate route, debounced; the browser holds no copy of them. Which rules the schema carries and which only the server checks is stated in sections 5 and 6 under "Rules".
- The server validates again on save, with `opis/json-schema` and the cross-field rules, and is authoritative.

**Messages.** Error texts are generic per JSON Schema keyword and written in the module, the same in the browser and on the server. A `pattern` carries its own text in `$error`. Each cross-field rule words its own.

### 10.11 The PHP view

The PHP view shows the object as the PHP an administrator would write: `$metadata['<entity ID>'] = [...];` for an entity, `'<id>' => [...],` with the type at key `0` for an authsource. It is produced by the translator with Secret references unresolved and is never stored. See [ADR 0010](docs/adr/0010-php-view-through-inverse-translators.md); what is specific to entities and to authsources is in sections 5.14 and 6.16.

**The editor** is a plain text area with line numbers and error marks. It has no syntax colouring and no side-by-side layout. Above it, a list of the errors and warnings of the text, each with a link to its line ("Line 7"), its kind, its option and its message. Beside it:

- the "Options" panel: a search field and the options of the schema, each with its name in monospace and its title; a set option shows the line it is on ("Line 13"), one not set offers "Insert", at the cursor;
- Copy and Download as `.php`, which give what is on screen;
- Reveal, an API request that returns the view again with the stored sensitive values in place of their sentinels. Text that cannot be read blocks it.

**Reading.** The text is parsed on the server, never in the browser, with `nikic/php-parser` and an allowlist walk of the AST; it is never executed.

- Accepted: one block, with its wrapper or as a bare array, made of literals and of the `SAML2\Constants::*` constants of a fixed list, which are written back as literals.
- Text that cannot be read, a syntax error or a value that is not a literal, is an error with its line and column. It blocks saving, Reveal and the switch to Settings.
- A block whose entity ID, authsource id or type differs from the object's is rejected.
- An uncataloged key goes to `extra` for an entity, with the warning "`sing.logout` is not a known option.", followed, when the key is close to a cataloged option, by "Did you mean `sign.logout`?" with the suggestion as a link that puts it in place of the key; for an authsource it is an error naming the key.
- Validation errors of the document are tied to the line of the root option they come from.

**Normalisation.** On every save the text comes back with its keys in schema order and its comments dropped. When that changed the text, an info callout says so, "Formatting was tidied and 2 comments were removed", with "This happens on every save." and "Do not show again", which stops the callout for later saves.

**Sensitive values.** The view opens with a fixed sentinel in place of each stored sensitive literal. Saving the sentinel unchanged keeps the stored value. The sentinel stands only for a stored value: in an unsaved object (a managed copy, "Add" from pasted configuration) sensitive literals appear as they are, and after "Replace from…" a sentinel stands for each stored value the merge leaves unchanged. The sentinel is tied to its option and is an error anywhere else. In `exampleauth:UserPass` the password is part of the key, so renaming a user in the text means typing the password again. A Secret reference is a plain string and always visible.

**Outside the text.** The enabled flag, the state of section 8.2, the notices and the secondary actions stay outside the text. The identifier is in it but cannot be changed.

**PHP elsewhere.** The same PHP is the Console's rendering of an object everywhere else:

- the diffs of Publish, Rollback and the Audit trail are line diffs over the normalised text, with every sensitive value replaced by a marker that says only whether it changed;
- the detail of an External entity is the array core receives, written with `VarExporter::export`, with the sensitive options of its set replaced by the marker and no reveal control;
- a document that the current translator cannot translate, such as an Audit trail entry recorded before a module update, is shown as raw JSON.

### 10.12 Adding objects

The Add action of each entity list and "Add authsource" open the paste area of section 9.6, titled "Add service provider" and the like, under the crumb "Add":

- a segmented control "Paste", "Upload" and "Start empty". Upload reads a local file into the text area in the browser;
- the text area, labelled "Metadata XML or PHP array" for an entity and capped at 1 MiB, and under it "Detected", a select showing the detected format, such as "SAML metadata · 1 entity" or "PHP array", that the administrator can correct, and the primary button "Review", which reads the input;
- for entities, the link "Copy from External entities".

What follows:

- "Start empty" for an entity opens the editor of the set with the required options only. For an authsource it first asks for the Authsource type, among the five, each with one line on what it is for.
- Reading pasted configuration is an API request that opens the editor filled and unsaved, with a report panel above it listing what was converted, what was moved to `extra` and what was ignored. What needs the administrator shows as validation errors. Nothing is saved until the administrator saves.
- XML that describes another kind of entity offers to switch to its set.
- Several entities in the input give a selectable list. Entities already managed in the set cannot be selected; those colliding with an External entity are marked as future Overrides or Shadowed (section 9.3). One selected entity opens in the editor; several are saved on their own and the interface moves to the entity list with the report.
- When pasted configuration holds what looks like a secret in clear, the report suggests a Secret reference.

"Replace from…" on a managed entity takes metadata XML in the same kind of text area and opens the editor with the merged document, unsaved, with the same report (section 9.7).

### 10.13 External entities and the Override comparison

**External entities.** The screen of section 9.2: read-only, grouped by source (type and location) and set, searchable by entity ID and name and paginated on the server.

- An unreadable source is shown with its error; the other sources are still listed.
- An expired External entity is marked, not hidden. One that is already managed in the same set is marked as such.
- The detail of an entity lists every copy the node's sources hold, marks the one served, shows each as PHP (section 10.11) with its sensitive options masked, and offers "Create managed copy", which says that the copy stops following its source.
- On `flatfile` and `pdo` sources each row has a checkbox, nothing ticked by default, and each source a "select all" that covers the whole source and not only the visible page. Rows already managed in the same set cannot be ticked. Import goes through a confirmation step, which lists only the ticked entity IDs, and comes back here with the report of section 9.5.

**Override comparison.** Reached from the notice on the edit screen and from Overview. It shows the current External entity against the managed one, as PHP text with the keys left out of the fingerprint hidden (section 9.4), and offers one action, "Mark as reviewed".

### 10.14 Publish

The confirmation screen of section 8.4. The header shows "Live: Snapshot #N" (section 10.3).

- "N changes", "against Snapshot #N", then every Pending change as a row: its sign and verb, the labels of section 10.8 (`~` Modified, `+` Added, `−` Withdrawn, `×` Deleted, `!` Unreadable), the object's name, or its identifier when it has none, its kind ("Service provider", "Authsource · saml:SP") and a summary: the options changed for Modified ("2 options", "1 option, 1 secret"), "New, 9 options" for Added, "Disabled" for Withdrawn, "Removed everywhere" for Deleted. Rows are grouped in the order Modified, Added, Withdrawn, Deleted, Unreadable.
- Each row expands to the line diff of its PHP text against the current Snapshot (section 10.11), with "Open", leading to the edit screen, and "Discard this change". An Unreadable row shows its load error at the row's end and expands to it. A Deleted row has no "Open".
- The problems that block, first, in the error callout "N problems block publishing", each naming its object and linking to it.
- "Ready to publish", a success callout, when nothing blocks.
- The warnings, collapsed under "N warnings", each naming its object and linking to it.
- A panel, "This Publication": "Becomes Snapshot #N", "Nodes" with the number of nodes, an optional comment and "Publish N changes", which reads "Publishing" while it runs. When Publication is not offered, the panel says why ("Fix 1 problem to publish."). Below a divider, "Discard all N changes…", which asks for confirmation in the dialog component (section 10.17): "Discard all N changes?", "Every saved change since Snapshot #41 is removed: 3 modified, 2 new, 1 withdrawn and 1 deleted object go back to what is live. This cannot be undone.", with "Keep changes" and "Discard N changes".

Warnings and problems name objects as the rows do. Before the first Publication there is no "against Snapshot #N" and the header shows no Snapshot.

States:

| State | Shows |
| --- | --- |
| Nothing to publish | "Nothing to publish", "Everything saved is live in Snapshot #N." and "History"; before the first Publication, the heading alone |
| Ready | The above, Publish enabled |
| Blocked | The problems; Publish disabled |
| Moved | The confirming request found a hash mismatch, a lost race or a new problem (section 8.4): the screen with the current state under the warning callout "The changes moved while this page was open", which names the object saved last and when ("Moodle was saved again 1 minute ago.") and says "This is the current list." |
| Published | After a successful Publication, on the same screen: the success callout "Snapshot #N is published" with "N changes." and "History", and below it "Nodes", one row per node of the Node table with its identifier, "This node" on the node serving the page, "Serves #42" or "Still on #41", and its last check ("8 s ago"). When the node serving the page could not build the new Snapshot, the callout is a warning carrying the build problem. Reloading Publish leaves this state; Nodes (section 10.16) keeps showing the progress |

### 10.15 History

Two tabs.

**Snapshots.** The retained Snapshots, newest first: number, when, who and comment, with the current one marked. Every other one offers "Roll back to this", which leads to the Rollback confirmation.

**Rollback confirmation.** The difference between the current Snapshot and the target as PHP text (section 10.11), the statement that what is saved in the Console is untouched, the warning of section 8.5 about modules that are not installed, and the button. A target that fails its checksum or format version check says so and offers no button. A lost race shows the confirmation again (section 4.8).

**Audit trail.** The rows of section 4.4, newest first: when, identity, action and object. Filters by object, by action and by date. Each row opens to its difference with the previous row of the same object and to the full document after the change, sensitive values as markers. Rows for `publish` show the Snapshot numbers and the comment; rows for `rollback` the Snapshot numbers. The notice of section 10.6 appears here when the identity is the constant `admin`.

### 10.16 Nodes

- One row per row of the Node table: identifier, the Snapshot it serves, its last check and whether it has problems.
- A row is highlighted when its number is not the current one, when its last check is older than 5 minutes, or when its flag is set. There are no named states.
- The node serving the page is marked, and its problems are listed in full below the table: objects left out of its build with their reason, managed authsources Shadowed by its File authsources, a missing `authsources.php` fragment, a missing `console:Snapshot` entry and the core `pdo` source in `metadata.sources`.
- The screen says that the problems of other nodes can only be read on those nodes.
- With a single node the screen shows that node and its detail, without treating the absence of others as a problem.

### 10.17 The front end

The front end lives in `frontend/`, outside `src/`, and talks to the module only through the API of section 10.4. See [ADR 0012](docs/adr/0012-console-ui-as-a-spa.md).

**Layers.** `frontend/src/` is organised in five layers, and a layer imports only from layers to its left:

| Layer | Holds |
| --- | --- |
| `tokens` | The custom properties of `console.css`, light and dark. `lib/` sits beside it, for helpers with no business meaning |
| `design-system` | The primitives, which know no term of the glossary |
| `domain` | One slice per area: `database`, `session`, `entities`, `publication`, `documents`. A slice owns its components, state and use cases and reaches the API only through its ports |
| `pages` | One composition per route, with no logic of its own |
| `app` | The entry, the router, the providers, and the adapters of the ports: HTTP, and in memory for stories and tests |

Domain slices import each other without cycles and only through their `index.ts`.

**Design system.**

- One stylesheet: the `console.css` of `prototype/console-ui`, with its tokens and component classes, plus layout classes for what the boards write inline and `[data-…]` selectors for the states React Aria exposes, with the values of the class selectors they mirror. It is linked by the shell, never imported into a component. There are no CSS modules, no CSS-in-JS and no `style` prop.
- No colour, size or font is written outside the token definitions.
- The primitives map to the component classes of `console.css`: button, field, select, text area, switch, check, segmented control, callout, status, chip, row, card, tabs, menu, code, diff, editor, empty state and the confirmation dialog. Those with behaviour build on `react-aria-components`; the rest are plain markup. The select stays the native `<select>`, and the switch and the check keep their visible native input, with React Aria's hooks, because `console.css` styles the native controls. Only the design system renders `<button>`, `<input>`, `<select>`, `<textarea>`, `<dialog>`, `<a>`, `<dl>`, `<details>` and `<summary>`; every page composes primitives and domain components.
- The shell's stylesheet link carries the id `react-aria-pressable-style`, and `console.css` holds React Aria's `touch-action` rule for pressable elements, so React Aria adds no `<style>` element.
- The confirmation dialog asks before Delete, Discard, Promote and Discard all, with a text that says what will happen, a button that repeats the verb and a cancel button, "Cancel", or "Keep changes" for Discard all (section 10.14). Publish and Rollback have confirmation screens instead, which carry a diff.

**Storybook.** Every primitive, domain component and page has stories next to it, rendered over the in-memory adapters, with one story per state of its board. The tokens appear first, as Foundations docs generated from the custom properties of `console.css`, light and dark. Storybook is not built into the package.

**Types.** TypeScript in strict mode. The types of the Console documents are generated from `docs/spec/schemas` and committed; the API's request and response types are written by hand next to the client that calls it.

**Build.** `composer build` runs `npm ci --ignore-scripts` and `vite build`. The output, hashed files and `.vite/manifest.json`, is written to `public/assets/app/` and committed. The Node and PHP versions are pinned in `mise.toml`.

**Development.** `composer dev` starts the `dev` profile of section 12.7 with a Vite service in front of the SimpleSAMLphp container. The browser opens the Console through Vite, which serves the front end with hot module replacement and proxies everything else to SimpleSAMLphp on the same origin. The node's module configuration sets `dev_server`, so the shell references Vite's client and the entry module instead of the manifest. Page, scripts, API and the HMR connection share one origin, so the default CSP and the admin session hold unchanged.

## 11. Failure behaviour

### 11.1 Rules

- **A bad record never takes SSO down.** Nothing the Console stores, publishes or writes to disk causes a fatal error during an SSO request, and nothing stops the other managed objects, the other metadata sources or the File authsources from loading.
- **The serving side catches everything.** The `MetadataStore` and `Authsources::merge()` catch every `\Throwable` of their own, log a warning and return what they can (section 3.2).
- **A node degrades per object.** An object a node cannot build is left out of that node's build alone; the rest is served.
- **A node never goes backwards.** When it cannot use the current Snapshot, it keeps the build it serves, or serves nothing from the Console when it has none. It never falls back to an earlier Snapshot.
- **The edit side fails closed.** A change that cannot be completed writes nothing, Audit trail included, and the screen says why.

### 11.2 During an SSO request

| Situation | What the node does |
| --- | --- |
| Database unreachable, local build present | Serves its build, indefinitely |
| No local build | Fetches the current Snapshot during this request, under a local lock (section 3.5) |
| No local build, and the fetch fails | Serves nothing from the Console; other sources and File authsources still answer. Tries again after 60 seconds. An accepted risk (section 1.6). |
| No local build, nothing published yet | Records it locally and asks the database no more; `cron` picks up the first Publication |
| `current` file or a build file missing or unreadable | The `MetadataStore` returns no entities for that set and logs a warning; `merge()` returns the File authsources alone and logs a warning |
| An entry of the build's `authsources.php` that is not an array, has no string at key `0` or has an integer id | Dropped with a warning; the other entries are merged |
| The module is not enabled, or the fragment is missing from `authsources.php` | Only the File authsources are served; a problem on the node's status when the current Snapshot holds managed authsources |
| A managed authsource Shadowed by a File authsource | The File authsource is served; a problem on the node's status |
| `console:Snapshot` missing from `metadata.sources` | No managed entity is served; managed authsources still are. A problem on the node's status (section 9.1) |
| The core `pdo` source in `metadata.sources`, with the database down | Core breaks every metadata operation, because that source's constructor throws. Outside the Console's control: a warning on the node's status and an accepted risk (section 1.6). |

### 11.3 Building a local copy

A node builds a local copy after a fetch, and again on a `cron` check when a resolved Secret reference has changed (section 3.5). Per Snapshot:

| Situation | What the node does |
| --- | --- |
| The database cannot be read | Keeps its build; reports the failure in the `cron` summary and its local status |
| The checksum does not match the stored bytes | Does not use the Snapshot; keeps its build, logs an error and sets its flag |
| The format version is higher than the node's code knows | Same: keeps its build, or serves nothing from the Console if it has none |
| Writing the build fails (disk full, permissions) | Keeps serving its build: `current` is switched only after the new build is complete |
| Writing its row of the Node table fails | Logs it and carries on |

Per object:

| Situation | What the node does |
| --- | --- |
| A Secret reference does not resolve | Leaves the object out |
| A key or certificate of a current slot fails its check (section 7.5) | Leaves the object out |
| `next_key` fails its check | Leaves out only that slot; serves the object with its current key |
| The node's code cannot translate the document: an unknown Authsource type, an unknown option, a module version that differs from the Console's | Leaves the object out |

Every object or slot left out is recorded with its reason in the build's `manifest.json`, logged, and sets the node's flag in the Node table. The Console highlights the node; the reason is shown only by that node, on the Nodes screen it serves, in its `cron` summary and in core's sanity check (section 3.5).

### 11.4 In the Console

| Situation | What the Console does |
| --- | --- |
| Database unreachable | Every API route answers 503 and the interface shows the "Database unreachable" page (section 4.7) |
| SQLite older than 3.24.0 | The "SQLite too old" page |
| A schema newer than the code | The "Console older than the database" page; nothing is read or written |
| Schema does not match the code | The pending migrations page |
| A migration fails | Stops at that migration, says which one and why; migrations already applied stay applied. The loser of two concurrent runs gets a clear message (section 4.6). |
| A save that is invalid | Shows every error at its field; writes nothing |
| A save, Publication or Rollback that loses a race | The conflict error of section 4.8: the editor or the confirmation screen shows the current state; nothing is retried |
| A Publication that something blocks | Shows the problems; writes nothing |
| A Snapshot too large for `max_allowed_packet` | Blocks the Publication, naming the variable (section 4.9) |
| A Rollback whose target fails its checksum or format version | Blocks the Rollback |
| Writing the Audit trail row fails | The change it records fails with it, being in the same transaction |
| A request without a valid request-forgery token | HTTP 403, "Request refused" in the interface, and a warning in the log (section 3.8) |
| A stored document that the current schema rejects, as after a module update | Listed with its errors and editable; blocks Publication until fixed or disabled; the current Snapshot keeps being served |
| A stored row whose `document` is not valid JSON or cannot be loaded otherwise | Listed with an "Unreadable" label and the load error, and counted as a Pending change while enabled (section 8.2). It has no form and no PHP view: opening it shows its raw bytes as they are, read-only. Disable, Delete and Discard are available; Discard rewrites the row from the current Snapshot, or disables it when the object is not in it. It blocks Publication until disabled, deleted or discarded, since skipping it would silently drop the object from the next Snapshot. |
| A metadata source that throws when the Console reads it | That source is shown as unreadable on the External entities screen; the others are listed (section 9.1) |
| A building problem on the node serving the Console | Shown on the Nodes screen |
| `console:Snapshot` missing from the node serving the Console | A warning on Overview and the entity lists, as the Override and Shadowed labels are then meaningless; nothing is blocked (section 9.1) |

The Console's link on core's Configuration tab never queries the database, so none of the states above breaks core's admin pages.

## 12. Test harness and local environment

### 12.1 Tools

| Tool | Use |
| --- | --- |
| Pest 5 (PHPUnit 13), with its `arch` and `mutate` plugins | Every test, the architecture checks and mutation testing |
| PHPStan 2 at `max` level, on `src/` only | Static analysis |
| `tomasvotruba/cognitive-complexity` 1.x | Cognitive complexity per method, as a PHPStan extension |
| PHP_CodeSniffer 4 with the SimpleSAMLphp ruleset of `simplesamlphp/simplesamlphp-test-framework` and `slevomat/coding-standard` 8.x | Coding style and method length |
| PCOV | Coverage, for the coverage threshold and for mutation testing |
| TypeScript `tsc` in strict mode | Type checking of the front end |
| ESLint with `typescript-eslint` and the React plugins | Front-end lint and the rules of section 12.4 |
| Vitest with Testing Library and jsdom, coverage through V8 | Unit tests of domain logic and the API client |
| Vitest browser mode on Playwright's Chromium, through Storybook's Vitest addon, with axe | Every story as a test, its `play` function and its accessibility check |
| Vitest `toMatchScreenshot`, with the browser in the official Playwright Docker image pinned by digest | Screenshots of page stories |

There are no end-to-end tests against a running SimpleSAMLphp in v1: no Pest browser plugin, and stories run over the in-memory adapters. Node runs only in development and CI. Mago is not used. PHP test files are not under static analysis.

### 12.2 Checks

**Unit and integration suites** cover each layer of section 3.6. Beyond them, the harness runs these checks:

- **Differential test.** The oracle for translation. Every valid fixture of a managed entity is loaded two ways: as a flat file read by core, and through Import, Publication and the node's build. What core receives must be the same array. Every valid fixture of an Authsource type is compared the same way with its `authsources.php` equivalent. There are no hand-kept golden output files.
- **Authsource instantiation.** For every Authsource type, the array translated from every valid fixture is accepted by the real authsource class. The Console itself never instantiates it (section 6.8).
- **Round trip.** For every schema, document to PHP to document is the identity (section 10.11).
- **Schema contract.** Every valid fixture passes its JSON Schema, and every invalid one fails for the reason the fixture names.
- **Conditions.** For every schema, the `x-when` annotations and the `if`/`then` clauses agree on what is required.
- **Validation parity.** Every valid and invalid fixture is validated by the browser's compiled validators and by `opis/json-schema`; both give the same verdict and, for schema errors, the same JSON pointers and texts.
- **Fault injection.** A malformed database record, a corrupt Snapshot on disk, the database down during an SSO request, a `cron` fetch interrupted midway and a Secret reference that does not resolve. None causes a fatal error, and the remaining entities, authsources and file-based sources keep loading (section 11).
- **Secret leakage.** A sensitive value never appears in a list, the Audit trail, a log or any API response other than the object of its own edit screen, an unsaved editor's and the response to Reveal.
- **Request forgery walk.** Every API POST route answers 403 without a valid token, and 415 with a valid token and a body that is not JSON (section 10.6).
- **After a Publication.** Without access to the database, core's `MetaDataStorageHandler` returns the published entity and `Auth\Source::getById()` instantiates the published managed authsource. The check stops at that seam: there is no SAML round trip in v1, and a fault visible only in a real SSO flow is an accepted gap.
- **Publication race.** In each engine suite, two PDO connections in one process interleave two Publications deterministically, and the loser gets the conflict error of section 4.8.
- **SimpleSAMLphp development branches.** A weekly run against the tip of the SimpleSAMLphp 2.5 branch and of `master` (section 13.3). It never blocks.

**API-level tests** cover every API route with a client that keeps cookies and sends JSON, and assert status, body and headers, `Cache-Control: no-store` included. They also check that the page shell answers every screen path, references only files named by the manifest and carries no inline script or style. They boot the SimpleSAMLphp kernel in-process against SQLite, with no web server and no dependency on the local environment of section 12.7.

**Story tests** cover every primitive, domain component and page. Every story renders in Chromium and passes axe with no violation; interactive stories drive the keyboard and check focus in a `play` function. Domain logic (the form engine's presence, `x-groups` counts, `x-when`, list rows and finder, and the use cases of each slice) has unit tests in jsdom. The HTTP adapters are tested against a stubbed `fetch`.

**Page screenshots.** Every page story is compared with its committed reference screenshot, light and dark, at desktop width and at 400 px. The browser runs in the Playwright Docker image, locally and in CI, so that a reference taken on one machine matches on another. `npm run test:visual` runs it locally and `npm run test:visual -- --update` writes new references. Primitives and domain components have no screenshots.

### 12.3 Thresholds

Every threshold blocks.

| Check | Threshold |
| --- | --- |
| Mutation score (MSI) | At least 85 %, on `Domain` and `Application` only, killed by their own tests (`tests/Unit`, `tests/Application`); infrastructure is not mutated |
| Line coverage | At least 90 %, on the whole of `src/` |
| PHPStan | Level `max` on `src/`, no errors |
| Method length | At most 30 lines (`SlevomatCodingStandard.Functions.FunctionLength`) |
| Cognitive complexity | At most 8 per method |
| PHP file size | At most 5000 characters per file in `src/` and `tests/` |
| Front-end line coverage | At least 90 %, on `frontend/src/`, measured over the jsdom and browser test projects in one run; generated types, stories and the in-memory adapters excluded |
| TypeScript | `tsc --noEmit` in strict mode, no errors; ESLint, no errors and no warnings |
| Front-end file size | At most 5000 characters per file in `frontend/src/` |

Line coverage is measured in one process that runs the persistence, migration and Publication tests on every engine whose DSN is set (section 12.6), so the code of every engine counts towards the 90 %, engine-only branches included, with no exclusion and no merging of reports. The threshold binds in CI, where every engine runs (section 13.2). Locally it is reached only with every engine that has its own implementation running, which means the `postgres` profile next to the default MariaDB (section 12.7).

The file size cap keeps every file cheap for an agent to read. JSON Schemas, migration SQL, the page shell template, the stylesheet, generated types, the built output, lock files, fixtures and reference screenshots are exempt.

PHP coverage thresholds are enforced by Pest, front-end ones by Vitest. No external coverage service is used.

### 12.4 Architecture and code rules

The architecture checks are Pest `arch()` tests. They enforce:

- the layers of section 3.6 and their direction of dependency;
- SQL and `PDO` only in the persistence namespace;
- no dependency of the serving side on persistence, except the first-request fetch;
- `declare(strict_types=1)` in every file;
- classes `final` unless a reason exists;
- no `dump`, `var_dump` or `die`.

Code carries no descriptive comments or docblocks. A type annotation PHPStan needs and a one-line comment for a non-obvious reason are allowed. The sniffs of the SimpleSAMLphp ruleset that demand docblocks are excluded. The same holds for TypeScript.

ESLint enforces on the front end:

- the layers of section 10.17: a layer imports only from layers to its left, `design-system` imports no `domain`, domain slices form no cycle and are imported only through their `index.ts`, and every file belongs to a layer;
- `<button>`, `<input>`, `<select>`, `<textarea>`, `<dialog>`, `<a>`, `<dl>`, `<details>` and `<summary>` only inside `frontend/src/design-system/`;
- no `style` prop and no `dangerouslySetInnerHTML` anywhere;
- no import of a stylesheet from a module;
- no import from `src/` or of PHP-side files; schemas only through the build's generated validators and types.

### 12.5 Fixtures

- Synthetic and written by hand. No real federation metadata.
- Organised per managed entity set and per Authsource type, each in valid, malformed and edge cases.
- Keys and certificates are generated when the test runs, or are visibly marked as test keys. Secret scanning is not relied on to catch a real secret in a fixture (section 14.5).

### 12.6 Database engines in the suites

| Suites | Engines |
| --- | --- |
| Persistence, migrations and Publication | SQLite, PostgreSQL, MariaDB and MySQL |
| Everything else, API-level tests included | SQLite only |

The DSN of each engine comes from an environment variable. The persistence, migration and Publication tests run once per engine whose variable is set, through a Pest dataset over those variables, so one run covers every engine available to it.

### 12.7 Local environment

One `docker-compose` file defines two separate environments. No automated test depends on the development one. The whole environment is excluded from the distributed package (`export-ignore`).

**Test environment.** Databases only. Pest and PHPStan run on the host, on the PHP and Node that `mise install` sets up from `mise.toml`, against the published database ports.

| Service | Image | Starts |
| --- | --- | --- |
| MariaDB | `mariadb:10.11` | By default. Healthcheck: the image's `healthcheck.sh`. |
| PostgreSQL | `postgres:15` | Only with the `postgres` profile. Healthcheck: `pg_isready`. |
| MariaDB, newest | `mariadb:11.8` | Only with its own profile, to reproduce the error 1020 path of section 4.8. |

SQLite needs no container. MySQL is not in the local environment; it runs in GitHub Actions only (section 13). Day-to-day work runs against MariaDB; the profiles exist to debug a failure specific to one engine.

**Development environment.** The `dev` profile, enough to see the module work by hand:

- One SimpleSAMLphp 2.5 instance in an image built from `php:8.4-apache`, installed with Composer, with the module mounted as a volume. Plain HTTP on `localhost`.
- It uses a database of its own in the same MariaDB service, separate from the one the tests use.
- It is a hosted IdP connected to its own SP, both configured with flat files. Users come from `exampleauth:UserPass`.
- It starts with an empty Console. The first steps are the schema migration and an Import of those flat files, both from the web.
- A Vite service, from a pinned Node image, serves the front end with hot module replacement and proxies the rest to SimpleSAMLphp on the same origin (section 10.17). It answers `localhost` and IP addresses, plus the host names listed in `CONSOLE_DEV_HOSTS`. `composer dev` starts the profile with it. The node's configuration sets `dev_server` and a host-relative `baseurlpath`.
- A scheduler service, a minimal container (such as `curlimages/curl`), calls the node's core `cron` URL every minute from outside the node's container (section 2.7), so the node is never shown as silent or forgotten and a rotated secret can be seen to take effect.
- There is no LDAP server, no SQL users table, no second SimpleSAMLphp and no second node. Two nodes serving different Snapshots cannot be seen locally; the Publication suites cover that behaviour.

Services wait for each other with `depends_on: service_healthy`. Data is synthetic, and the only persistent volume is the database's.

## 13. GitHub Actions

### 13.1 Triggers

| Trigger | Runs | Blocking |
| --- | --- | --- |
| Every pull request (`pull_request`, also when a label is added or removed) and every push to `main` | Every job of section 13.2 | Yes |
| Weekly schedule | The jobs of section 13.3 | No |

`pull_request_target` is never used. There are no path filters: every pull request runs everything.

### 13.2 Blocking jobs

The matrix is not the full product of PHP versions and engines. The SQL does not depend on the PHP version, and the PHP code does not depend on the engine outside persistence.

| Job | PHP | Database |
| --- | --- | --- |
| Static analysis: PHPStan, PHP_CodeSniffer, method length, cognitive complexity, file size | 8.4 | None |
| Coverage, with PCOV, including the persistence, migration and Publication suites on every engine | 8.4 | SQLite, `postgres:15`, `mariadb:10.11`, `mariadb:11.8`, `mysql:8.4` |
| Mutation score, with PCOV, in parallel | 8.4 | SQLite |
| Full suite | Every stable release from 8.4 that SimpleSAMLphp 2.5 supports | SQLite |
| Lowest dependencies: `composer update --prefer-lowest`, full suite | 8.4 | SQLite |
| `composer audit --locked` | 8.4 | None |
| Front end, on the Node version of `mise.toml`: `npm ci --ignore-scripts`, ESLint, `tsc`, Vitest in jsdom and in Chromium with its coverage threshold, generated types up to date, `vite build` with no difference from the committed `public/assets/app/` | | None |
| Visual: the page screenshots of section 12.2, with the browser in the pinned Playwright image; on a failure the diffs are uploaded as a workflow artefact | | None |
| Visual gate: fails when a pull request adds, changes or deletes a reference screenshot and does not carry the `visual-change` label. Only the maintainer applies the label | | None |
| Package contents: `git archive` holds `public/assets/app/` with its manifest and `docs/spec/schemas/`, and none of `frontend/`, `package.json`, `package-lock.json` or `node_modules` | | None |
| `npm audit --omit=dev` | | None |
| CodeQL on the workflows and on `javascript-typescript` (section 14.5) | | None |

`mariadb:11.8` runs next to the minimum because the error 1020 path of section 4.8 exists only from MariaDB 11.6.2.

- CI does not reuse the `docker-compose` file. Databases are service containers; PHP is installed on the runner, with the extensions SimpleSAMLphp 2.5 requires, the three PDO drivers and PCOV.
- `composer.lock` is committed (`export-ignore`) and every job except the lowest-dependencies one installs from it, so a pull request never breaks because of someone else's release. `package-lock.json` is committed (`export-ignore`) and installed with `npm ci`.
- A single aggregating job depends on all the others. It is the only check the ruleset on `main` requires (section 14.6), so the matrix can change without touching the ruleset.

### 13.3 Weekly job

Scheduled once a week, non-blocking:

- `composer update` to the newest dependencies;
- the tip of the SimpleSAMLphp 2.5 branch and of `master`;
- the latest PostgreSQL and MySQL, on their `latest` tags.

A failed run is reported only by GitHub's own email for failed scheduled workflows. The workflow opens no issue.

GitHub disables a scheduled workflow after 60 days without activity in the repository. Nothing is done about it: merged weekly Dependabot pull requests keep the repository active, and GitHub warns by email first. This is an accepted risk.

### 13.4 Hardening

- `permissions: contents: read` by default. No job has write permissions.
- No workflow uses a secret.
- Actions are pinned by commit SHA and updated by Dependabot (section 14.5).
- `actions/checkout` runs with `persist-credentials: false`.
- npm never runs install scripts (`--ignore-scripts`).
- `concurrency` cancels runs superseded by a newer push to the same branch or pull request.

## 14. Repository security policy

The policy applies from the first tagged release. Until then a security bug is an ordinary issue, with no advisory and no CVE. Private vulnerability reporting is already enabled.

### 14.1 Reporting

- The only channel is GitHub private vulnerability reporting. There is no contact email.
- `SECURITY.md` points to it and asks reporters not to open public issues.
- Reports reach the sole maintainer. There is no SLA: acknowledgement is best effort, indicatively within 7 days, with no committed time to a fix.

### 14.2 Disclosure

- Coordinated, with a cap of 90 days from the report.
- The advisory is published together with the release that fixes it. At 90 days without a fix, it is published anyway with the known mitigations.
- Fixes are prepared in the advisory's temporary private fork.

### 14.3 Supported versions

Only the latest released minor receives security fixes. There are no backports. Before 1.0, only the latest release does.

### 14.4 Scope

`SECURITY.md` states what is out of scope:

- flaws in SimpleSAMLphp core or in other modules, which are referred to their own channels;
- secrets stored in clear in the database and in the Snapshot, a documented decision ([ADR 0001](docs/adr/0001-no-application-level-encryption-of-secrets.md));
- the administrator seeing a secret in the edit form of the object that holds it (section 7.3).

### 14.5 Advisories and automation

- Every confirmed vulnerability is published as a GitHub Security Advisory, so that it reaches Packagist and `composer audit`.
- A CVE is requested through GitHub for medium severity or above. Below that, the advisory alone.
- Reporters are credited. There are no bounties.
- **Dependabot.** Alerts and security updates are on. Version updates cover `composer`, `npm` and `github-actions`, weekly, as one grouped pull request per ecosystem. An `npm` update that changes the built output fails the front-end job until `public/assets/app/` is rebuilt in the same pull request. Security updates are immediate and not grouped. No Dependabot pull request is merged automatically, whether a patch or an action: each passes the full CI and is merged by the maintainer.
- **Secret scanning and push protection** are on. They are not a defence for this domain's secrets, such as LDAP bind passwords and SAML keys, which mostly match no provider pattern; fixtures follow section 12.5 instead.
- **Static security analysis.** There is no dedicated PHP security analyser: CodeQL does not support PHP, and Psalm taint analysis and Semgrep are not used. PHPStan at `max` level (section 12) and a blocking `composer audit` on every pull request (section 13.2) stand in. CodeQL runs for the `actions` language, to analyse the workflows, and for `javascript-typescript`, on the front end.

### 14.6 Branch and release integrity

- A ruleset on `main` forbids force-push and deletion and requires the aggregating CI check of section 13.2 to pass. No review is required, since there is one maintainer.
- Release tags are protected against deletion and rewriting.
- Commits and tags are not signed: Composer does not verify signatures.

`SECURITY.md`, the Dependabot configuration, the workflows and the repository settings are built as part of the implementation.
