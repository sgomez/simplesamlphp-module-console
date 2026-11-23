# Prior art for database-backed SimpleSAMLphp administration

Research for issue #2. Sources read on 2026-11-23. Baseline: SimpleSAMLphp 2.5 (latest tag `v2.5.4`, 2026-11-09).

Every claim cites the source that owns it. Claims marked **unverified** could not be checked against a primary source. Claims marked **derived** follow from the cited sources but were not executed.

## Answer

No maintained tool gives SimpleSAMLphp 2.x a web interface or database for managing SAML entities or authsources at the level the Console targets.

- The only official editor, `metaedit`, is a per-user self-service registry for `saml20-sp-remote` with five editable fields. Its latest release cannot be installed next to SimpleSAMLphp 2.5, and its list and import templates are defective. Nothing in it is worth reusing.
- JANUS, the only tool that ever covered the Console's ground (database, revisions, workflow, export), was built for SimpleSAMLphp 1.x, is archived and declares itself no longer developed. Its successor is a separate Java application.
- Third-party modules on Packagist and GitHub offer nothing for 2.x beyond a metadata source decorator.
- Nothing manages authsources from a database on 2.x. One archived 1.x application did it by putting PHP code inside `config/authsources.php`.
- The closest living precedent for the Console's shape is not a metadata tool: `simplesamlphp-module-oidc` is an official, actively released module with a database-backed admin CRUD, its own migrations, CSRF-protected forms and an admin menu hook, tested against 2.5.

The Console is therefore a new build. It coexists with `metarefresh`, core `pdo` and `cirrusgeneral` through `metadata.sources`; it replaces `metaedit` rather than extending it.

## Summary table

| Tool | Kind | Works on SSP 2.5 | Maintained | Covers of the Console's destination | Verdict |
|---|---|---|---|---|---|
| `simplesamlphp-module-metaedit` | Official module | Released `v2.2.1`: no (derived). `master`: yes, unreleased | CI upkeep only | Self-service edit of 5 fields of `saml20-sp-remote`, XML import of one SP | Do not reuse or extend |
| Core `pdo` metadata handler | Core | Yes | Yes | Storage only, read at request time | Import source; coexist |
| Core `admin` module | Core | Yes | Yes | Read-only listing, XML to PHP converter | Coexist; reuse its parser path |
| `simplesamlphp-module-metarefresh` | Official module | Yes (`v1.3.1`) | Yes | Federation aggregates only | Coexist (already settled) |
| `simplesamlphp-module-oidc` | Official module | Yes (`v6.4.*`, `v6.5.0`) | Yes, active | None of the SAML scope; same architecture for OIDC clients | Pattern reference |
| `cirrusidentity/simplesamlphp-module-cirrusgeneral` | Third party | Declares `^2.0`, only alpha tags for SSP 2 | Low activity | Per-entity overrides on top of other sources, no UI, no database | Coexist; pattern reference |
| JANUS (`janus-ssp/janus`) | Third party | No (SSP 1.x, PHP 5.4, Symfony 2.6) | Archived | Most of it, plus delegated roles | Concept reference only |
| OpenConext Manage | Separate application | Not a module | Yes | Entity registry for OpenConext, not SimpleSAMLphp | Out of reach |
| `sitya/samlidp` | Separate application | No (SSP 1.17) | Archived | Database-driven entities and authsources, multi-tenant | Precedent for the authsources fragment |
| `gollmann/MetaMerge` | Third party | No (2014 code) | Dead | Templates over `metarefresh` output | Superseded by `metarefresh` templates |
| `uhi67/simplesamlphp-module-refreshauthsources` | Third party | No (PHP >= 5.6 era) | Dead | Authsources from XML metadata | Unverified, source unreachable |

## Official modules

### metaedit

Sources: repository at tag [`v2.2.1`](https://github.com/simplesamlphp/simplesamlphp-module-metaedit/tree/v2.2.1), [Packagist](https://packagist.org/packages/simplesamlphp/simplesamlphp-module-metaedit).

**What it is.** The README calls it "a web interface for very basic metadata editing and registration" ([README](https://github.com/simplesamlphp/simplesamlphp-module-metaedit/blob/v2.2.1/README.md)). The whole module is one controller, one form helper and four templates.

**Features** ([`src/Controller/MetaEditor.php`](https://github.com/simplesamlphp/simplesamlphp-module-metaedit/blob/v2.2.1/src/Controller/MetaEditor.php), [`src/MetaEditor.php`](https://github.com/simplesamlphp/simplesamlphp-module-metaedit/blob/v2.2.1/src/MetaEditor.php), [`routing/routes/routes.yml`](https://github.com/simplesamlphp/simplesamlphp-module-metaedit/blob/v2.2.1/routing/routes/routes.yml)):

- Three routes: list (`/`), edit (`/edit`), XML import form (`/import`).
- The set is hard-coded: every storage call passes `'saml20-sp-remote'`. No IdP sets, no authsources.
- Editable fields: `entityid`, `name`, `description`, one `AssertionConsumerService` location (always HTTP-POST, index 0) and one `SingleLogoutService` location (always HTTP-Redirect). `formToMeta()` builds the entity from these alone, so certificates, attributes, NameID formats and every other option are dropped on save, including those that came from an XML import.
- Multilingual `name` and `description` are flattened to the `en` value, or discarded if there is none.
- Validation is limited to `entityid` and `name` being non-empty. XML input goes through `Utils\XML::checkSAMLMessage()` and `SAMLParser::parseDescriptorsString()`, and only the last entity of the document is kept.
- Authentication uses a configurable authsource (`auth`, default `login-admin`). Identity is one attribute (`useridattr`, default `eduPersonPrincipalName`).
- Ownership: each entity stores an `owner` key. Only the owner can edit or delete. An entity without `owner` is editable by nobody. There is no administrator role.
- Delete is triggered by a `delete` query parameter on the list route. No CSRF protection appears in the controller, the form helper or the templates.

**Storage.** It instantiates `SimpleSAML\Metadata\MetaDataStorageHandlerSerialize` directly with the `metahandlerConfig` option (default directory `metadata/metaedit`, [`config/module_metaedit.php.dist`](https://github.com/simplesamlphp/simplesamlphp-module-metaedit/blob/v2.2.1/config/module_metaedit.php.dist)) and calls `saveMetadata()` and `deleteMetadata()`. No database. Every save is live at once for any `serialize` source in `metadata.sources` pointing at that directory: no draft state, no publication, no history, no rollback. The only trace of a change is an `updated` timestamp inside the entity.

**Defects at `v2.2.1`, still present on `master`** ([`templates/metalist.twig`](https://github.com/simplesamlphp/simplesamlphp-module-metaedit/blob/v2.2.1/templates/metalist.twig), [`templates/xmlimport.twig`](https://github.com/simplesamlphp/simplesamlphp-module-metaedit/blob/v2.2.1/templates/xmlimport.twig)):

- The list template tests `metadata|length > 0` and prints "No entries registered" when it is true. The controller always passes an array with the two keys `mine` and `others`, so the condition is always true and the entity rows never render (derived from reading the code, not executed).
- Inside the loops the template reads `metadata.name` and `metadata.entityid` instead of the loop variable `md`, and the edit and delete links carry the name where the controller expects the entity ID.
- The import form posts to the absolute path `/edit` while every other link uses `/module.php/metaedit/...`.

These suggest the module is kept compiling rather than used.

**Compatibility with SimpleSAMLphp 2.5.** `v2.2.1` requires `symfony/http-foundation: ^6.4` and `simplesamlphp/saml2: ^5.0` ([`composer.json` at `v2.2.1`](https://github.com/simplesamlphp/simplesamlphp-module-metaedit/blob/v2.2.1/composer.json)). SimpleSAMLphp `v2.5.4` requires `symfony/http-foundation: ~7.4` and `simplesamlphp/saml2: ~6.1` ([core `composer.json`](https://github.com/simplesamlphp/simplesamlphp/blob/v2.5.4/composer.json)). The ranges are disjoint, so Composer cannot install `v2.2.1` together with 2.5 (derived; not executed). `master` already requires `php ^8.3`, `simplesamlphp ^2.5@dev`, `saml2 ^6.1`, `http-foundation ^7.4` ([`composer.json` on `master`](https://github.com/simplesamlphp/simplesamlphp-module-metaedit/blob/master/composer.json)), but no release carries it. On 2.5 the module is only reachable as `dev-master`.

**Activity.**

- Tags: `v1.0` (2015-08-07), `v2.0.0` (2020-12-20), `v2.2.0` (2025-05-27), `v2.2.1` (2025-06-02).
- `master` is 50 commits ahead of `v2.2.1`. The only source change in `src/` is a one-line config accessor fix; the rest is CI, tooling and dependency bumps ([compare](https://github.com/simplesamlphp/simplesamlphp-module-metaedit/compare/v2.2.1...master)).
- Last non-bot commit 2026-04-02 (CI cache key). The issue tracker holds no issues, open or closed; the two open items are pull requests.
- Packagist: about 17,000 installs in total and about 160 a month, against roughly 7 million for `metarefresh`.

**Verdict.** Not reusable and not worth extending. The data model (owner per entity, five fields), the storage (direct serialized files, live on save) and the access model (self-service, no administrator) all contradict the Console's settled constraints, and the code base is about 500 lines. Coexistence is possible but pointless: a `serialize` directory written by `metaedit` would be one more external source the Console shows read-only.

### Core PDO metadata handler

Sources: [`MetaDataStorageHandlerPdo.php`](https://github.com/simplesamlphp/simplesamlphp/blob/v2.5.4/src/SimpleSAML/Metadata/MetaDataStorageHandlerPdo.php), [`bin/initMDSPdo.php`](https://github.com/simplesamlphp/simplesamlphp/blob/v2.5.4/bin/initMDSPdo.php), [`bin/importPdoMetadata.php`](https://github.com/simplesamlphp/simplesamlphp/blob/v2.5.4/bin/importPdoMetadata.php).

- Supported sets: `adfs-idp-hosted`, `adfs-sp-remote`, `saml20-idp-hosted`, `saml20-idp-remote`, `saml20-sp-remote`.
- One table per set, created by `initDatabase()` as `entity_id VARCHAR(255) PRIMARY KEY, entity_data <text type>`. Table names replace `-` with `_` and take the global database prefix plus an optional `tablePrefix`.
- Write API: `addEntry()` and `removeEntry()`. Nothing in core calls them from a web request.
- `bin/initMDSPdo.php` creates the tables. `bin/importPdoMetadata.php` loads every `*.php` file of `metadatadir` into them. Both are plain scripts, not `bin/console` commands.
- It is read at request time, which the Console's Snapshot rule forbids for its own data.

Verdict: an import source for the Console (already in the map) and a peer in `metadata.sources`. Its two-column schema confirms the map's finding that it has no validation, flags, timestamps or history.

### Core admin module

Source: [`modules/admin/routing/routes/routes.yml`](https://github.com/simplesamlphp/simplesamlphp/blob/v2.5.4/modules/admin/routing/routes/routes.yml).

Routes are configuration, diagnostics, phpinfo, sandbox, authsource test, federation overview, certificate download, show remote entity, and a metadata converter. Only the converter accepts POST, and it converts pasted XML to PHP arrays without storing anything. No route edits metadata or authsources.

Verdict: coexist. Other modules extend its navigation through hooks (`metaedit` uses `hook_configpage`, `oidc` uses `hook_adminmenu` and `hook_federationpage`), which is the integration point the Console should use.

### Extension point for module-provided sources

[`MetaDataStorageSource::getSource()`](https://github.com/simplesamlphp/simplesamlphp/blob/v2.5.4/src/SimpleSAML/Metadata/MetaDataStorageSource.php) maps the built-in types `flatfile`, `xml`, `serialize`, `mdx`/`mdq`, `pdo` and `directory`, and resolves any other `type` through `Module::resolveClass($type, 'MetadataStore', MetaDataStorageSource::class)`. This confirms the map's fact and adds one: 2.5 ships a `directory` handler ([`MetaDataStorageHandlerDirectory.php`](https://github.com/simplesamlphp/simplesamlphp/blob/v2.5.4/src/SimpleSAML/Metadata/MetaDataStorageHandlerDirectory.php)) that the map does not list among the built-in types.

### metarefresh

`v1.3.1` (2026-03-18) requires `php ^8.3` and `simplesamlphp/simplesamlphp ~2.5@dev` ([`composer.json`](https://github.com/simplesamlphp/simplesamlphp-module-metarefresh/blob/v1.3.1/composer.json)). It is the one metadata module with real adoption. It fetches and stores aggregates and has no editing interface. The map already settles coexistence; nothing found here changes that.

### oidc: the closest architectural precedent

Sources: repository at tag [`v6.5.0`](https://github.com/simplesamlphp/simplesamlphp-module-oidc/tree/v6.5.0) (2026-11-05), [version table](https://github.com/simplesamlphp/simplesamlphp-module-oidc/blob/v6.5.0/docs/1-oidc.md), [installation guide](https://github.com/simplesamlphp/simplesamlphp-module-oidc/blob/v6.5.0/docs/2-oidc-installation.md).

It manages OIDC clients, not SAML entities, so it covers none of the Console's scope. It is listed because it is the only official module that does what the Console must do structurally, on the same baseline:

- **Compatibility.** The version table lists `v6.4.*` as tested with SimpleSAMLphp `v2.5.*` on PHP >= 8.3; `v6.5.0` develops against `simplesamlphp/simplesamlphp: 2.5.*`.
- **Database.** It uses core's `SimpleSAML\Database` (the `database.dsn` settings of `config.php`), not Doctrine. Tables go through `applyPrefix()`.
- **Migrations.** A hand-written `DatabaseMigration` service keeps an `oidc_migration_versions` table and runs one method per version ([`src/Services/DatabaseMigration.php`](https://github.com/simplesamlphp/simplesamlphp-module-oidc/blob/v6.5.0/src/Services/DatabaseMigration.php)). The code branches on the driver for SQLite versus MySQL syntax, which shows the cost of multi-database DDL without an abstraction layer.
- **Both a web and a command-line path.** Migrations run from an admin page or from `bin/install.php`.
- **Admin CRUD.** `Admin/ClientController` offers index, show, add, edit, delete and reset secret ([source](https://github.com/simplesamlphp/simplesamlphp-module-oidc/blob/v6.5.0/src/Controllers/Admin/ClientController.php)).
- **Forms.** Built with `nette/forms`, with per-field validators and a CSRF protection control ([`src/Forms/ClientForm.php`](https://github.com/simplesamlphp/simplesamlphp-module-oidc/blob/v6.5.0/src/Forms/ClientForm.php)).
- **Authorization.** `Utils\Auth::isAdmin()` / `requireAdmin()`, with an optional permission-based fallback ([`src/Admin/Authorization.php`](https://github.com/simplesamlphp/simplesamlphp-module-oidc/blob/v6.5.0/src/Admin/Authorization.php)). The admin-only half matches the Console's single-role v1.
- **Services.** Routes in PHP plus a `routing/services/services.yml` container definition.

Differences that matter: it has no draft/publish split, no versioning and no rollback, and protocol requests read the database (through a cache), which is the opposite of the Snapshot rule.

Verdict: not reusable as code, but the reference to read before specifying module layout, migrations, admin authorization, menu hooks and CSRF handling.

## Third-party modules

The Packagist list of all 193 packages of type `simplesamlphp-module` was read in full ([search endpoint](https://packagist.org/search.json?type=simplesamlphp-module)). Besides the official modules above, none provides a metadata or authsource editor. GitHub repository search for SimpleSAMLphp metadata and admin tools, and code search for classes extending `MetaDataStorageSource`, returned vendored copies of core plus the items below. GitHub search is not exhaustive, so absence there is evidence, not proof.

### cirrusidentity/simplesamlphp-module-cirrusgeneral

Source: [README](https://github.com/cirrusidentity/simplesamlphp-module-cirrusgeneral/blob/master/README.md).

Its `ModifyingMetadataSource` is a metadata source that delegates to other sources and applies strategies to each entity before returning it: an ADFS fix-up, an overriding source, or inline PHP. Configuration only; no UI and no database. `composer.json` declares `simplesamlphp/simplesamlphp: ^2.0`, but the tags for SimpleSAMLphp 2 are all `v3.0.0-alpha.*` and the last commit is from 2025-05. Behaviour on 2.5 is **unverified**.

Relevance: it solves "adjust a federated entity locally" by decoration at read time, where `metarefresh` solves it with `template` at fetch time. If the Console ever lets an administrator override a federated entity, these are the two existing shapes. It coexists with the Console as a wrapper in `metadata.sources`.

### gollmann/MetaMerge

Source: [README](https://github.com/gollmann/MetaMerge/blob/master/README.md). Command-line scripts that merge templates into `saml20-sp-remote` metadata fetched by `metarefresh`, keyed by entity ID or entity category. All commits are from 2014. Superseded by `metarefresh` templates. Not relevant beyond confirming the recurring need.

### uhi67/simplesamlphp-module-refreshauthsources

Source: [Packagist](https://packagist.org/packages/uhi67/simplesamlphp-module-refreshauthsources). Described as "a module to refresh authsources using XML metadata provider". Last version `1.2.1` from 2019-12, requires only `php >= 5.6`, 3 installs. Its Bitbucket repository returned 404, so what it does and how it writes authsources is **unverified**. It is the only package on Packagist whose description mentions generating authsources.

### rediris-es/simplesamlphp-module-idpinstaller

Source: [README](https://github.com/rediris-es/simplesamlphp-module-idpinstaller/blob/master/README.md). A one-time wizard that "pre-configures a basic simpleSAMLphp identity provider". Last commit 2019-08, SimpleSAMLphp 1.x era. Which files it writes is **unverified**. An installer, not an administration tool.

## JANUS

Sources: [`janus-ssp/janus`](https://github.com/janus-ssp/janus), its [README](https://github.com/janus-ssp/janus/blob/develop/README.md), [`composer.json`](https://github.com/janus-ssp/janus/blob/develop/composer.json) and [docs](https://github.com/janus-ssp/janus/tree/develop/docs).

**Fate.** The repository is archived. The README opens with "Janus is no longer under active development". The last release is `1.23.1` (2017-07-04); the last commit (2020-02-14) only edits the README. It requires `php >= 5.4`, `symfony/symfony ~2.6.0` and `doctrine/orm ~2.4`, and was a module for SimpleSAMLphp 1.x. It cannot run on 2.x, and no port was found on GitHub or Packagist.

**What it covered** (from its docs):

- A database registry of SAML connections (SPs and IdPs) through Doctrine ORM with Doctrine migrations. A 2013 migration splits `Connection` from `ConnectionRevision`, so every change was stored as a revision.
- Configurable workflow states with an `isDeployable` flag: only entities in a deployable state were returned to consumers ([`docs/workflows.md`](https://github.com/janus-ssp/janus/blob/develop/docs/workflows.md)).
- Role-based access control, attribute release policies, notifications and a REST API.
- Metadata export to the file system or FTP (`lib/Exporter/FileSystem.php`, `lib/Exporter/FTP.php`).
- Self-service: its quickstart says it "is focused around selfservice of registering SAML entities".

**Successor.** OpenConext replaced it with [OpenConext Manage](https://github.com/OpenConext/OpenConext-manage), a Java 21 and MongoDB application with a JavaScript front end. Its README notes that the migration from a JANUS database was removed in version 3.0.0. It publishes to OpenConext components, not to SimpleSAMLphp, and is not a module.

**Verdict.** No code is reusable. Two of its ideas match Console decisions and are worth citing in the ADRs as precedent: revisions per entity, and a deployable state that separates saving from serving. Three of its traits explain its weight and are already out of scope for v1: delegated roles, self-service, and a framework stack bolted onto SimpleSAMLphp (a full Symfony 2 kernel plus Doctrine ORM inside a module).

## Authsources

No maintained tool manages authsources from a database or a UI on SimpleSAMLphp 2.x. Core's admin module only tests them.

One precedent exists for the mechanism in the map's working hypothesis. [`sitya/samlidp`](https://github.com/sitya/samlidp) (archived, SimpleSAMLphp `^1.17.2`, Symfony 3.4) ships a [`conf/simplesamlphp/authsources.php`](https://github.com/sitya/samlidp/blob/master/conf/simplesamlphp/authsources.php) that is PHP code: it boots the application kernel and assigns `$config` from a database-backed service, per request and per host. Its `saml20-idp-hosted.php` and `saml20-sp-remote.php` do the same for `$metadata`.

What this shows and what it does not:

- It shows that `config/authsources.php` being executable PHP is enough to feed authsources from elsewhere without patching core, on 1.17.
- It reads the database on every request, which the Console forbids. The Console's variant, a fragment that reads the node-local Snapshot, is the same mechanism with a different data source.
- It says nothing about 2.5. Whether the fragment approach still holds there is for the authsources ticket to establish.

## Consequences for the Console

1. **No reuse candidate.** The spec can state that the Console replaces `metaedit` for installations that used it and does not depend on it.
2. **`metaedit` data as an import source.** A `metaedit` directory is an ordinary `serialize` directory whose entities carry the extra keys `owner` and `updated`. The flat-file import already planned can cover `serialize` directories if desired; that is a scope question for the import ticket, not a finding.
3. **Coexistence is through `metadata.sources`.** `metarefresh` output, core `pdo`, `serialize` directories and `cirrusgeneral` wrappers all sit beside a Console source. The collision warning already planned for `metarefresh` applies equally to every other configured source.
4. **Read `oidc` before the persistence-layer decision.** It demonstrates that core `SimpleSAML\Database` plus hand-written migrations is viable on 2.5, and also what it costs: driver branches in migration code. That is direct evidence for the "Doctrine DBAL is a candidate, not a given" constraint, in both directions.
5. **JANUS is the cautionary precedent** for scope: its extra features (roles, self-service, embedded framework) are the ones the map already excludes.

## Open points

- `metaedit` `v2.2.1` being uninstallable on 2.5 is derived from disjoint Composer constraints. No PHP runtime was available to run `composer require` and confirm.
- The `metaedit` template defects were found by reading, not by running the module.
- `uhi67/simplesamlphp-module-refreshauthsources` and the file output of `rediris-es/simplesamlphp-module-idpinstaller` are unverified.
- Private or unpublished tools (in-house registries at federations and universities) cannot be found by this method.
