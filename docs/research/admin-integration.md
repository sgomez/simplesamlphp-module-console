# Admin module integration: routing, menu hooks, admin identity, CLI

Research for issue #6. Baseline: SimpleSAMLphp 2.5 (`composer.json` reports `2.5.4`).

## Sources

All paths are relative to the repository named, at the commit named. Line numbers refer to those commits.

| Short name | Repository | Ref |
| --- | --- | --- |
| core | `simplesamlphp/simplesamlphp` | branch `simplesamlphp-2.5`, commit `6e34a73985f63aac5326e0c1f416bf3efc047c90` |
| metarefresh | `simplesamlphp/simplesamlphp-module-metarefresh` | `master`, commit `0b63afe7e803f0c5df0c074ce541e92ceda1250c` |
| metaedit | `simplesamlphp/simplesamlphp-module-metaedit` | `master`, commit `bec79c81737d816a5b5130221ae4ccff1e1e3d62` |
| installer | `simplesamlphp/composer-module-installer` | `README.md` on the default branch |

Claims are tagged **[source]** (read in the code or docs), **[run]** (executed, see "Verification run") or **[unverified]** (inference, not checked).

## Summary

1. A module exposes pages with `routing/routes/*.{php,xml,yaml,yml}` and controller classes in `src/Controller/`, which core autowires. Nothing else is needed.
2. Extension points of the admin interface are PSR-14 events since 2.5 (`src/Event/Listener/*.php`), with the legacy `hooks/hook_<name>.php` files still called afterwards. Official external modules still ship legacy hooks.
3. `Utils\Auth::requireAdmin()` only checks that the session is authenticated against the authsource named `admin`. That authsource is replaceable by any other, so a real user identifier is available, but only if the deployer replaces it. With the default `core:AdminPassword` the identity is the constant `admin`.
4. `requireAdmin()` performs no authorization: whoever can log in at the `admin` authsource is an administrator.
5. A module can register Symfony console commands through `routing/services/*.yml`; they run as `bin/console --module <name> <command>`. No core or official module does this today, but it works (verified by running it).
6. Core has no CSRF protection facility. The Console must bring its own for state-changing forms.

## 1. Request routing

- Entry point is `public/module.php/<module>/<path>`. `Module::process()` extracts the module name, rejects disabled modules, then boots one Symfony kernel **per module**: `new Kernel($module)` (core `src/SimpleSAML/Module.php:171-248`). **[source]**
- The kernel imports core routes from `routing/routes/*` and the module's `routing/routes/**/*` with extensions `.php`, `.xml`, `.yaml`, `.yml`, prefixed with the module name (core `src/SimpleSAML/Kernel.php:32`, `:144-153`). Both `routes.yml` (core modules, metaedit) and `routes.yaml` (metarefresh) are in use. **[source]**
- If the module has no routing directory or no route matches, `Module::process()` falls back to serving files from the module's `public/` directory, executing `.php` files and streaming anything else with a MIME type taken from the extension (core `src/SimpleSAML/Module.php:244-355`). This fallback is how static assets are served. **[source]**
- Route definitions use plain Symfony YAML: `path`, `defaults._controller: 'FQCN::method'`, optional `methods` and path parameters with defaults (core `modules/admin/routing/routes/routes.yml:1-72`, `modules/cron/routing/routes/routes.yml:10-16`). **[source]**
- URLs are built with `Module::getModuleURL('<module>/<path>')` (core `src/SimpleSAML/Module.php:519-529`), also exposed to Twig as `moduleURL()` (core `src/SimpleSAML/XHTML/Template.php:341`). **[source]**

## 2. Controllers

- Every class under the module's `src/Controller/` is registered as a public, autowired service in namespace `SimpleSAML\Module\<module>\Controller\` (core `src/SimpleSAML/Kernel.php:159-183`). **[source]**
- Services available for constructor injection out of the box: `SimpleSAML\Configuration`, `SimpleSAML\Session`, `SimpleSAML\Auth\AuthenticationFactory`, `SimpleSAML\Utils\HTTP` (core `routing/services/simplesamlphp.yml:8-21`), plus what `FrameworkBundle` provides. `Request` and route parameters are resolved as action arguments. **[source]**
- A module can declare more services in `routing/services/**/*.{php,xml,yaml,yml}`; the kernel loads them only when that module is the kernel's module (core `src/SimpleSAML/Kernel.php:121-136`). **[source]**
- Conventions in core and official modules: constructor takes `Configuration` and optionally `Session`; other collaborators are created with `new` in the constructor and replaced in tests through setters such as `setAuthUtils()` (core `modules/admin/src/Controller/Config.php:57-75`, `modules/cron/src/Controller/Cron.php:46-63`; metarefresh `src/Controller/MetaRefresh.php:42-58`). Actions return a `SimpleSAML\XHTML\Template`, which extends Symfony `Response` (core `src/SimpleSAML/XHTML/Template.php:53`), or any other `Response`. **[source]**
- Module configuration is read with `Configuration::getConfig('module_<name>.php')` (core `modules/cron/src/Controller/Cron.php:50`; metarefresh `src/Controller/MetaRefresh.php:45`). **[source]**
- The compiled container is cached per module in `<cachedir>/<module>` and the kernel runs with `debug = false` (core `src/SimpleSAML/Kernel.php:42-72`). Changes to routes or services therefore need a cache clear; the 2.5 upgrade notes recommend `composer clear-symfony-cache` and describe the stale-cache symptoms (core `docs/simplesamlphp-upgrade-notes-2.5.md:22-38`; script defined in core `composer.json:148-151`). **[source]**

## 3. Templates, assets, translations

- A template is created with `new Template($config, '<module>:<file>.twig')`; data goes in `$t->data` (core `modules/cron/src/Controller/Cron.php:96-98`). Module templates live in `templates/` at the module root. **[source]**
- Pages extend `base.twig`, which offers the blocks `preload`, `header`, `contentwrapper` / `content`, `footer` and `postload`, and expects a `pagetitle` variable (core `templates/base.twig:1-33`; usage in core `modules/cron/templates/croninfo.twig:1-8`). **[source]**
- Templates of other modules are reachable as `@<module>/<path>`: the loader adds a module's template directory lazily when its namespace is first requested, and throws if that module is disabled (core `src/SimpleSAML/XHTML/TemplateLoader.php:26-33`, `:64-76`). **[source]**
- Assets live in `public/assets/` of the module and are referenced with `{{ asset('css/x.css', '<module>') }}`, which appends a cache-busting `?tag=` derived from the file contents (core `src/SimpleSAML/XHTML/Template.php:182-220`). They are served by the `public/` fallback described in section 1. **[source]**
- Translations are gettext files at `locales/<lang>/LC_MESSAGES/<module>.po` (for example core `modules/cron/locales/es/LC_MESSAGES/cron.po`). Templates use the `trans` filter or `{% trans %}` tag; PHP marks strings with `Translate::noop()`. A template that shows strings owned by another module must register that domain with `$template->getLocalization()->addModuleDomain('<module>')` (core `src/SimpleSAML/Locale/Localization.php:129-135`; core `modules/admin/src/Controller/Menu.php:79-83`). **[source]**
- The official translation guide is a stub: core `docs/simplesamlphp-translation.md` contains only a TODO. **[source]**
- Twig globals worth knowing: `currentLanguage`, `isRTL`, `templateId`, `isProduction`, `baseurlpath`, `queryParams` (core `src/SimpleSAML/XHTML/Template.php:345-358`). **[source]**

## 4. Adding entries to the admin interface

### Mechanism

- 2.5.0 introduced PSR-14 events "to replace hook infrastructure" (core `docs/simplesamlphp-changelog.md:79`). `v2.4.4` has neither `src/SimpleSAML/Event/` nor `modules/admin/src/Event/`; `v2.5.0` has both. **[source]**
- Each extension point dispatches the event first and then calls the legacy hook, so both styles work in 2.5 (core `docs/simplesamlphp-modules.md:188-196`). The cron module labels the hook call `DEPRECATED` (core `modules/cron/src/Cron.php:58-63`). **[source]**
- Listener discovery: for each enabled module, every `modules/<module>/src/Event/Listener/*.php` is loaded as class `SimpleSAML\Module\<module>\Event\Listener\<basename>`. Each public method whose first parameter is typed with a class becomes a listener for that class. Listeners are instantiated with `new $className()`, so they get **no dependency injection** and need a zero-argument constructor (core `src/SimpleSAML/Event/Provider/ModuleListenerProvider.php:25-72`, `:131-136`). **[source]**
- A listener that throws is logged and the exception is rethrown, so a broken listener breaks the admin page that dispatched the event (core `src/SimpleSAML/Event/Dispatcher/EventDispatcher.php:29-39`). **[source]**
- Legacy hooks: file `hooks/hook_<name>.php` defining function `<module>_hook_<name>(&$data)` (core `src/SimpleSAML/Module.php:541-606`). **[source]**

### Extension points of the admin module

| Event class (`SimpleSAML\Module\admin\Event\`) | Legacy hook | Dispatched from | Payload |
| --- | --- | --- | --- |
| `AdminMenuEvent` | `adminmenu` | core `modules/admin/src/Controller/Menu.php:89-97` | Template; top menu is `$template->data['menu'][<id>] = ['url' => ..., 'name' => ...]` |
| `ConfigPageEvent` | `configpage` | core `modules/admin/src/Controller/Config.php:146-150` | Template; link list is `$template->data['links'][] = ['href' => ..., 'text' => ...]` |
| `FederationPageEvent` | `federationpage` | core `modules/admin/src/Controller/Federation.php:188-193` | Template of the Federation tab |
| `SanityCheckEvent` | `sanitycheck` | core `modules/admin/src/Controller/Config.php:378-383` | `addInfo()` / `addError()` (core `modules/admin/src/Event/SanityCheckEvent.php:19-28`) |

Worked example of a listener: core `modules/cron/src/Event/Listener/ConfigPageListener.php:9-21` adds a link to the Configuration tab and registers its translation domain.

- The top menu holds three fixed tabs (`main`, `test`, `federation`) and is rendered by `@admin/includes/menu.twig`, which highlights the tab whose id equals the template variable `frontpage_section` (core `modules/admin/src/Controller/Menu.php:32-45`; core `modules/admin/templates/includes/menu.twig:5-9`; core `modules/admin/templates/federation.twig:2`). **[source]**
- `AdminMenuEvent` fires only when a controller calls `Menu::insert()`. Only admin module controllers do so; cron and metarefresh pages render no admin menu. A module page that wants the admin tabs must build a `Menu`, call `insert($template)` and include `@admin/includes/menu.twig` itself. `Menu` is `final` and lives in a `Controller` namespace, so this reuses a class that is not documented as public API. **[unverified]** that this renders correctly from another module's template; the pieces are all public, but it was not executed.
- `SanityCheckEvent` gives the Console a native place to report problems, such as a missing or corrupt Snapshot, on the admin Configuration tab. **[source]** for the mechanism; the use is a suggestion.

### What official external modules do today

- metarefresh and metaedit still ship only legacy hooks: metarefresh `hooks/hook_configpage.php:14-22` and `hooks/hook_cron.php:14-31`; metaedit `hooks/hook_configpage.php:14-22`. Neither has `src/Event/Listener/`. Both add a link to the Configuration tab, not a top-level tab. **[source]**
- Recommendation in the core docs: write listeners in new code (core `docs/simplesamlphp-modules.md:194-196`). Since the baseline is 2.5 only, listeners alone are enough. **[source]**

## 5. Access restriction and administrator identity

### What `requireAdmin()` does

- `Utils\Auth::isAdmin()` returns true when the session is valid for authority `admin` or the legacy authority `login-admin` (core `src/SimpleSAML/Utils/Auth.php:39-43`). **[source]**
- `requireAdmin()` returns if `isAdmin()`; otherwise it starts a login at the authsource with id `admin`, or throws if none is configured (core `src/SimpleSAML/Utils/Auth.php:55-70`). **[source]**
- There is no attribute or role check anywhere in that path. Being authenticated at `admin` is the whole test. **[source]**

### The `admin` authsource is replaceable

- The shipped `config/authsources.php.dist:16-22` defines `'admin' => ['core:AdminPassword']` with the comment "The default is to use core:AdminPassword, but it can be replaced with any authentication source." **[source]**
- `core:AdminPassword` forces the username to `admin`, checks the password against `auth.adminpassword` in `config.php` and returns the fixed attributes `['user' => ['admin']]` (core `modules/core/src/Auth/Source/AdminPassword.php:33`, `:50-82`). With the default setup there is exactly one shared identity. **[source]**
- When `admin` is any other authsource (for example a `saml:SP`), the attributes it returns are stored in the session under authority `admin` and can be read with `(new Auth\Simple('admin'))->getAttributes()` or `$session->getAuthData('admin', 'Attributes')` (core `src/SimpleSAML/Auth/Simple.php:260-301`; core `src/SimpleSAML/Session.php:1151-1157`). The admin module itself reads `getAuthData('admin', 'Expire')` this way (core `modules/admin/src/Controller/Config.php:91`). **[source]**
- Consequence of the missing authorization check: if `admin` is pointed at an institutional IdP, every user of that IdP is an administrator of the whole SimpleSAMLphp installation unless the authsource or the IdP restricts who can log in. How best to restrict it (an authproc filter on the SP authsource, the `authorize` module, or a dedicated IdP) was not researched. **[unverified]**
- The core docs do not describe replacing the `admin` authsource beyond the comment above and a `multiauth` example that lists `core:AdminPassword` as one option (core `modules/multiauth/docs/multiauth.md:27`, `:67`). **[source]**

### The alternative: a module-specific authsource

- metaedit ignores `requireAdmin()`. It reads `auth` and `useridattr` from `module_metaedit.php`, calls `(new Auth\Simple($authsource))->requireAuth()`, takes `$attributes[$useridattr][0]` as the user id and fails with "User ID is missing" when absent (metaedit `src/Controller/MetaEditor.php:87-98`; metaedit `config/module_metaedit.php.dist:9-10`). **[source]**
- This gives a named user but makes the module's access rule independent from the SimpleSAMLphp administrator, and like `requireAdmin()` it authorizes anyone who can authenticate. **[source]**

### Options for the audit trail

| Option | Access rule | Identity recorded | Cost |
| --- | --- | --- | --- |
| A. `requireAdmin()` only | The SimpleSAMLphp administrator | Whatever the `admin` session holds; constant `admin` by default | None. Audit is anonymous on default installs. |
| B. `requireAdmin()` plus an optional `useridattr` module option read from the `admin` session attributes, falling back to `admin` | The SimpleSAMLphp administrator | A real user id when the deployer has replaced the `admin` authsource | One config option. Keeps the "single role" constraint. |
| C. metaedit style: own `auth` + `useridattr` options | Anyone who can log in at the configured authsource | A real user id, mandatory | Diverges from the admin role; needs its own authorization rule. |

Option B fits the settled constraint "v1 has a single role: the SimpleSAMLphp administrator" and still yields a usable audit trail where the deployment allows it. The audit record should store the authsource-provided identifier as an opaque string and state its origin, because on a default install it carries no information. This is a recommendation, not a finding.

### CSRF

- A case-insensitive search for `csrf` in the PHP files under core `src/` and `modules/` returns nothing. Core offers no token helper; the admin module has a single POST route, the metadata converter (core `modules/admin/routing/routes/routes.yml:67-72`). **[source]**
- Whether Symfony's CSRF component can be enabled inside the SimpleSAMLphp kernel (it normally needs the `symfony/security-csrf` package and the framework session) was not checked. **[unverified]**

## 6. Command-line commands

### How `bin/console` works

- `bin/console` reads `--module` / `-m` (default `core`), builds `new Kernel($module)` and runs a `FrameworkBundle` console application (core `bin/console:15-20`; core `src/SimpleSAML/Console/Application.php:16-24`). **[source]**
- The container for that kernel is built from core `routing/services/*` plus the selected module's `routing/services/**/*` (core `src/SimpleSAML/Kernel.php:121-136`). Core registers its only command there with the `console.command` tag (core `routing/services/console.yml:8-12`). **[source]**
- Therefore a module command is a service tagged `console.command` in the module's `routing/services/`, and it is visible only when the module is selected with `-m`. **[run]**
- No core module ships a `routing/services` directory, and metarefresh and metaedit ship none either. Module-provided commands are possible but have no precedent among the modules examined. **[source]**
- `src/SimpleSAML/Command/RouterDebugCommand.php` exists in core but is not registered in `routing/services/console.yml`; the `debug:router` listed by the console is the `FrameworkBundle` one. **[source]** for the missing registration, **[run]** for the listing.

### What official modules do instead

- Standalone PHP scripts in the module's `bin/` that bootstrap by hand: `require_once($baseDir . '/src/_autoload.php')`, check `Module::isModuleEnabled()`, parse `$argv` or `getopt()` (core `modules/cron/bin/cron.php:13-48`; metarefresh `bin/metarefresh.php:12-25`). They locate the installation with `dirname(__FILE__, 4)`, which assumes the module sits in `<ssp>/modules/<name>/`. **[source]**
- The cron script refuses to run as root because generated files would get the wrong owner (core `modules/cron/bin/cron.php:26-30`). The same concern applies to a command that writes a Snapshot or builds the kernel cache. `bin/console` sets `umask(000)` (core `bin/console:10`). **[source]**

### Verification run

Executed in a throwaway `php:8.3-cli-alpine` container against the core commit above, after `composer install --no-dev --ignore-platform-reqs`, with `config/config.php` copied from the `.dist` file plus `module.enable.demo = true`, a `cachedir` and a `secretsalt`.

A module `demo` with two files:

`modules/demo/routing/services/console.yml`

```yaml
---
services:
  SimpleSAML\Module\demo\Command\HelloCommand:
    autowire: true
    tags: ['console.command']
```

`modules/demo/src/Command/HelloCommand.php`: a `Symfony\Component\Console\Command\Command` subclass with `#[AsCommand(name: 'demo:hello')]` and a constructor taking `SimpleSAML\Configuration`.

Results:

- `php bin/console -m demo demo:hello` printed the output and resolved the autowired `Configuration` (it printed version `2.5.4`).
- `php bin/console demo:hello` (no `-m`) failed with `There are no commands defined in the "demo" namespace.`
- `php bin/console -m demo list` showed `demo:hello` next to `cache:clear`, `debug:router` and `ssp-cache:clear`.
- The run created `cache/core` and `cache/demo`, confirming one container cache per module.
- The module class was autoloadable without a Composer entry for it: core registers a PSR-4 autoloader for `modules/<name>/src/` (core `composer.json:33`, `src/_autoload_modules.php:14-48`).

Not verified: the same command with the module installed through Composer rather than placed in `modules/` by hand, and behaviour when `config.php` or the cache directory is unavailable at container start.

### Consequences for the Console

- Publication and import commands can be ordinary Symfony commands with dependency injection, invoked as `bin/console -m <module> <command>`. The `-m` flag is mandatory and must be part of the documented container start-up line.
- The first invocation builds `<cachedir>/<module>`, so the start-up command needs a writable `cachedir` and should run as the web server user.
- Listeners are instantiated outside the container (section 4), so code shared between a listener, a controller and a command cannot rely on container wiring alone. **[source]** for the constraint.

## 7. Packaging facts that affect the above

- The module is installed by `simplesamlphp/composer-module-installer` into `modules/<module name>`, and the package name must have the form `<vendor>/simplesamlphp-module-<module name>` with `"type": "simplesamlphp-module"` (installer `README.md`, section "Making a module installable through Composer"). **[source]**
- Every lookup in this document resolves the module under `<ssp>/modules/<name>`: `Module::getModuleDir()` (core `src/SimpleSAML/Module.php:126-132`), hooks (`:548`), listeners (core `src/SimpleSAML/Event/Provider/ModuleListenerProvider.php:32`). **[source]**
- The module must be enabled in `module.enable`; only `core`, `admin` and `saml` are on by default (core `src/SimpleSAML/Module.php:103-107`). **[source]**
- Current official modules require `php ^8.3`, `simplesamlphp/simplesamlphp ~2.5` and Symfony `~7.4` (metarefresh `composer.json`; core `composer.json:49`, `:80-101`). **[source]**

## Open points

- Rendering the admin tab bar on a page of another module (section 4).
- How to restrict who may log in when the `admin` authsource is replaced (section 5).
- CSRF protection inside the SimpleSAMLphp kernel (section 5).
- Module commands when the module is installed through Composer, and start-up failure modes (section 6).
