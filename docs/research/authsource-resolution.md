# How SimpleSAMLphp 2.5 resolves authsources

Research for issue #3. Source read: `simplesamlphp/simplesamlphp`, branch `simplesamlphp-2.5` at commit
[`6e34a73`](https://github.com/simplesamlphp/simplesamlphp/tree/6e34a73985f63aac5326e0c1f416bf3efc047c90)
(`composer.json` declares version 2.5.4, PHP `^8.3`). Paths and line numbers below refer to that commit.

## Answer

The working hypothesis holds. A fragment in `config/authsources.php` that merges managed authsources from a
node-local Snapshot works without patching core, and every reader of authsources in core and in the official
modules checked sees the merged result. It was confirmed by running the 2.5 code (see "Experiment").

It holds only if the fragment obeys four rules, each of which was shown to break things when ignored:

1. It must not leak variables into the scope of the `require` (use a closure or a static method call).
2. It must catch `\Throwable` itself; core only catches `ParseError`, and handles it badly.
3. The Snapshot must be validated at Publication: each entry an array whose element `0` is a string, and no
   numeric authsource ids. One bad entry breaks listing pages for all authsources.
4. Merge with `$config + $managed` (or `array_replace($managed, $config)`), never `array_merge`.

`Auth\Source` has no extension point for resolving ids. The only alternative that avoids both the fragment and a
core patch is `Configuration::setPreLoadedConfig()` driven from a Composer `autoload.files` entry; it is more
fragile and less visible than the fragment.

## How authsources are loaded

All three static lookups read the same `Configuration` object for `authsources.php`:

| Method | Source | Behaviour |
| --- | --- | --- |
| `Source::getById($authId, $type)` | `src/SimpleSAML/Auth/Source.php:341-368` | `Configuration::getConfig('authsources.php')`, `getOptionalArray($authId)`, then `parseAuthSource()`. Returns `null` for an unknown id (throws if `$type` was given). |
| `Source::getSources()` | `Source.php:478-483` | `Configuration::getOptionalConfig('authsources.php')->getOptions()`, that is `array_keys()` of the array (`Configuration.php:1145-1148`). No validation, no instantiation. |
| `Source::getSourcesOfType($type)` | `Source.php:60-80` | Iterates **every** id, calls `$config->getArray($id)` and `validateSource()` on each, and instantiates those whose element `0` equals `$type`. |

`parseAuthSource()` (`Source.php:291-320`) resolves element `0` through `Module::resolveClass()`, first as an
`Auth\Source\Factory` and then as an `Auth\Source` class, and builds a new object. There is no object cache: every
`getById()` call constructs the authsource again. `Module::resolveClass()` throws if the module is not installed
or not enabled (`src/SimpleSAML/Module.php:450-455`).

`validateSource()` (`Source.php:494-502`) is the only structural check core does: element `0` must exist and be a
string. Everything else is validated by each authsource's constructor.

### `Configuration` loading and caching

- `getConfig()` and `getOptionalConfig()` build `<configdir>/<filename>` and call `loadFromFile()`
  (`Configuration.php:267-313`). The config directory is `SIMPLESAMLPHP_CONFIG_DIR` if set, otherwise
  `<basedir>/config` (`src/SimpleSAML/Utils/Config.php:75-98`).
- `loadFromFile()` (`Configuration.php:139-212`) does a plain `require($filename)` inside the method, accepts
  either a returned array or a `$config` variable, and rejects a missing, non-array or **empty** `$config` with
  `Error\ConfigurationError`.
- The only cache is the static `self::$loadedConfigs`, keyed by full path (`Configuration.php:91`, `141-143`,
  `203`). It lives for one PHP request. There is no cross-request cache, no compiled container and no
  serialisation of authsources. Each request re-executes `authsources.php` once, so a new Snapshot is picked up
  by the next request with no cache to flush on the SimpleSAMLphp side.
- No schema validation is applied to the file. `Configuration` is a typed accessor over the array.

### Who reads authsources

Searched the whole tree for `authsources` and for `Source::getById|getSources|getSourcesOfType`. Nothing reads
the file with its own `include`; everything goes through `Configuration`:

- Core: `Auth\Simple::getAuthSource()` (`src/SimpleSAML/Auth/Simple.php:62`), `IdP::__construct()` for the
  `auth` option of `saml20-idp-hosted` (`src/SimpleSAML/IdP.php:107-112`), `Utils\Auth` for `admin`
  (`src/SimpleSAML/Utils/Auth.php:62`).
- `core` module: `AbstractSourceSelector` calls `Configuration::getConfig('authsources.php')->toArray()` directly
  (`modules/core/src/Auth/Source/AbstractSourceSelector.php:37-38`); login controllers use `getById()`.
- `saml` module: SP controllers and `Auth\Source\SP` use `getById()` (`modules/saml/src/Controller/ServiceProvider.php:239,270,561,726`;
  `modules/saml/src/Auth/Source/SP.php:1061,1247`). SP hosted metadata is generated from the instantiated source,
  so managed `saml:SP` authsources get metadata endpoints.
- `admin` module: the test page lists `getSources()` (`modules/admin/src/Controller/Test.php:110`); the federation
  page calls `getSourcesOfType('saml:SP')` (`modules/admin/src/Controller/Federation.php:358`).
- `multiauth`: `getById()` (`modules/multiauth/src/Auth/Source/MultiAuth.php:167,218`).
- `debugsp`: `getSourcesOfType('saml:SP')` (`modules/debugsp/src/Controller/Test.php:86`).
- Official modules outside the core repository (default branches, found with a code search for
  `authsources.php` in the `simplesamlphp` organisation): `ldap` `ConnectorFactory::fromAuthSource()` and
  `Auth\Process\BaseFilter` and `webauthn` `PushbackUserPass` all call
  `Configuration::getConfig('authsources.php')`. Not checked: third-party modules, and whether those default
  branches match the releases compatible with 2.5.

So the merged array is the single source for every reader found. A reader that parsed the file itself would
bypass the fragment, but none exists in the code checked.

### Extension points

- `Auth\Source` has none for id resolution. `getById()` carries the comment "for now - load and parse config
  file" (`Source.php:343`). The methods are static and `parseAuthSource()` is private.
- `Module::resolveClass()` lets a module provide authsource **types** and factories, not ids.
- Hooks (`Module::callHooks`) exist only for `exception_handler`, `cron`, `adminmenu`, `federationpage`,
  `configpage` and `sanitycheck`. None runs before authsources are read.
- `Configuration::setPreLoadedConfig($config, 'authsources.php')` (`Configuration.php:238-255`) is public and
  writes into the same `$loadedConfigs` cache. It is the only API that can replace the file's content.

## Experiment

Run against the commit above with its Composer dependencies, PHP 8.3 CLI, `SIMPLESAMLPHP_CONFIG_DIR` pointing at
a test directory. `authsources.php` declared `admin` and `collide` and then merged a Snapshot; the test called
`getSources()` twice, `getById()`, `getSourcesOfType()` and counted how often the file was executed.

| Case | Result |
| --- | --- |
| Closure fragment, valid JSON Snapshot | Managed id listed, `getById()` instantiates it, `collide` keeps the file's value, file executed once. |
| Closure fragment, corrupt JSON | Warning logged through `SimpleSAML\Logger`, file-declared authsources intact. |
| Closure fragment, Snapshot missing | Same as corrupt. |
| Snapshot with numeric id `"123"` | `getSources()` and `getById()` work; `getSourcesOfType()` throws `TypeError` (`getArray()` receives an `int` under `strict_types`, `Source.php:68`). |
| Snapshot entry that is a scalar | `getSourcesOfType()` throws `AssertionFailedException` for **any** type. |
| Snapshot entry without string element `0` | `getSourcesOfType()` throws `Exception` for **any** type. |
| Fragment assigns `$filename` at top level | Works, but the file was executed 6 times instead of 1: the cache key was overwritten. |
| Snapshot as PHP file, `include` without guard, valid | Works. |
| Snapshot as PHP file, `include` without guard, parse error | First call throws `ConfigurationError`; every later call in the request sees an **empty** authsources config, `admin` included. |
| Fragment throws a non-`ParseError` exception | Every call throws; nothing is cached. |

## What breaks it

**Variable leakage.** The file runs in the scope of `Configuration::loadFromFile()`, which uses `$filename`,
`$required`, `$fileSystem`, `$config`, `$returnedConfig`, `$spurious_output` and `$cfg` after the `require`
(`Configuration.php:139-212`). A fragment that assigns `$filename` changes the cache key and the error location.
Keep the fragment to one expression: an immediately invoked closure, or a static call into the module.

**Errors inside the fragment.** Core catches only `ParseError`, and then caches an empty configuration before
throwing (`Configuration.php:155-157`). A PHP Snapshot with a syntax error therefore removes all authsources for
the rest of the request, not just the managed ones. Any other throwable propagates to the caller. The fragment
has to wrap its whole body in `try { ... } catch (\Throwable)`.

**Invalid entries.** `getSourcesOfType()` validates every entry before filtering by type, so one malformed
managed authsource breaks the admin federation page and `debugsp` for everyone. A managed authsource whose module
is missing or disabled, or whose constructor rejects its options, only fails when it is used or when its own type
is listed. Publication must check structure; per-type checks are a separate question.

**Numeric ids.** PHP turns numeric string keys into integers, and `getSourcesOfType()` then fails. The Console
must reject ids that PHP would cast to an integer key.

**Merge operator.** `array_merge()` renumbers integer keys and lets the later array win. `$config + $managed`
keeps the file's entry on collision. This also keeps reference aliases such as
`$config['default'] = &$config['x']` (documented in `config/authsources.php.dist:10-13`) pointing at file
entries, provided the alias is created before or after the merge on the same array.

**Output.** Anything the fragment prints is discarded and logged as a warning (`Configuration.php:152-160`,
`205-209`). Harmless, but the fragment should not print.

**Empty result.** `loadFromFile()` rejects an empty `$config`. Irrelevant while `admin` stays in the file; do not
let the Console become the only source of authsources.

**Re-entrancy.** The file is not in `$loadedConfigs` while it is being executed, so fragment code that itself
asks for `authsources.php` (directly or through `Auth\Source`) recurses without limit. `Logger` only needs
`config.php`, which `public/_include.php:24` loads first; logging from the fragment worked in the experiment.

**Class availability.** If the fragment calls a class of the module, that class must be autoloadable whenever
`authsources.php` is read, including CLI scripts. Composer autoloading does not depend on the module being
enabled, but an uninstalled module gives a fatal `Error`. Guard with `class_exists()` or keep the fragment
self-contained.

**In-flight logins and sessions.** Authsource ids are stored in login state and looked up again on return
(`modules/core/src/Controller/Login.php:117`, `modules/saml/src/Auth/Source/SP.php:1061`). Removing, renaming or
retyping an authsource in a Publication fails those logins; core already documents this for hand edits
(`modules/exampleauth/src/Auth/Source/External.php:214-228`). A Snapshot swap that is not atomic can do the same
to any request that reads a half-written file.

**OPcache (not verified here; from PHP's documented behaviour).** `authsources.php` itself changes only at
install time. If the Snapshot is a PHP file that is `include`d, a node running with
`opcache.validate_timestamps=0` never sees a new Snapshot until the file is invalidated or the pool restarted,
and with timestamp validation a change is seen after at most `opcache.revalidate_freq` seconds. A Snapshot read
with `file_get_contents()` and `json_decode()` is not subject to OPcache but is parsed on every request that
touches authsources. If a "current version" symlink is used, the realpath cache adds another delay. This needs a
measurement before choosing the Snapshot format.

**Long-running workers (not verified).** Under a runtime that keeps PHP state between requests, the static
`$loadedConfigs` cache would never be refreshed. Nothing in core resets it.

## Alternatives without patching core

1. **Fragment calling a module class** (recommended shape of the hypothesis):
   `$config = \SimpleSAML\Module\console\...::merge($config);` behind a `class_exists()` guard. The module owns
   reading, validation, precedence and the warning; the hand-added line never changes.
2. **Self-contained fragment.** No dependency on the module's classes, but the logic is frozen in a file the
   Console does not control.
3. **`Configuration::setPreLoadedConfig()` from a Composer `autoload.files` entry.** Runs on every request
   without touching `authsources.php`. Drawbacks found in the source: `setPreLoadedConfig()` defaults the config
   directory to `<basedir>/config` and ignores `SIMPLESAMLPHP_CONFIG_DIR` unless `setConfigDir()` is called first
   (`Configuration.php:243-249` against `275-276`); it must load and merge the real file itself; it runs before
   the error handlers of `public/_include.php` are installed; and the override is invisible to an administrator
   reading the config. Not run in the experiment.
4. **Generating the whole `authsources.php`.** Rejected by the map: the file must stay hand-owned and win.
5. **A proxy authsource type.** A module type can delegate to other sources, as `AbstractSourceSelector` does,
   but each id must still be declared in the file, so it cannot add ids dynamically.

## Open points for later tickets

- Snapshot format for authsources (PHP array against JSON) and the OPcache measurement above.
- Per-type validation at Publication: core offers nothing beyond constructing the authsource.
- Policy for Publications that remove or rename an authsource with logins in flight.
