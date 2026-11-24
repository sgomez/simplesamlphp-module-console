# Own page shell and static assets

Research for issue #37. Baseline: SimpleSAMLphp 2.5 (`composer.json` reports `2.5.4`). Builds on `docs/research/admin-integration.md` (branch `research/admin-integration`), sections 3 and 4; what is established there is not repeated.

## Sources

Paths are relative to the repository named, at the ref named. Line numbers refer to those refs.

| Short name | Repository | Ref |
| --- | --- | --- |
| core | `simplesamlphp/simplesamlphp` | branch `simplesamlphp-2.5`, commit `6e34a73985f63aac5326e0c1f416bf3efc047c90` |
| assets-base | `simplesamlphp/simplesamlphp-assets-base` | `v2.5.15`, commit `6c65cfe90415e2922a9a2ace2bbb72761525fa35` (the version core's `composer.lock` pins) |
| installer | `simplesamlphp/composer-module-installer` | `v1.7.1` (pinned by core's `composer.lock`) |
| oidc | `simplesamlphp/simplesamlphp-module-oidc` | `master`, commit `f813c29280c3f8cceb883a637af7838e6079d669` |
| design | this repository | branch `prototype/console-ui`, commit `cb52523f91a63a4521d4a7c479d48f790efa8156` |

Claims are tagged **[source]** (read in code or docs), **[run]** (executed, see "Verification run") or **[unverified]**.

## Answer

Yes. A module page that does not extend `base.twig` renders under the default theme and under a custom `theme.use`, and a self-hosted stylesheet, a woff2 font, one script file, inline SVG and `data:` images all pass core's default CSP. **[run]**

It is a departure from what official modules do, and two things in the design boards do not survive the default CSP as drawn: the Google Fonts link and the `style="…"` attributes.

## 1. Template resolution and themes

- `new Template($config, 'console:page.twig')` splits the name at `:` into module and file and renders `@console/page.twig` (core `src/SimpleSAML/XHTML/Template.php:139`, `:258-262`, `:592-596`). **[source]**
- Lookup paths are added in this order (core `src/SimpleSAML/XHTML/Template.php:256-290`): **[source]**
  1. every directory of the active theme, `modules/<thememodule>/themes/<theme>/<ns>/`, registered under namespace `<ns>`; `default` maps to the main namespace (`:392-427`);
  2. the page's own module `templates/`, under its module namespace and again under `__parent__` (`:265-269`);
  3. the theme module's own `templates/` (`:270-278`);
  4. `core`, then the root `templates/` as main namespace (`:280-285`).
- Nothing forces a template to extend `base.twig`. `base.twig` is only loaded when a template names it. Core itself ships standalone documents: `templates/post.twig:1-14`. **[source]**
- A theme only replaces what is looked up by name. A theme that overrides `default/base.twig` or `default/_header.twig` has no effect on a page that never loads them. **[run]** for `_header.twig`, **[source]** for the rest.
- A theme can still override the module's templates, including its shell, by shipping `themes/<theme>/<module>/<file>.twig` (core `docs/simplesamlphp-modules.md:173-186`). **[run]**
- `@__parent__/<file>.twig` always resolves to the module's stock file, bypassing the theme (core `docs/simplesamlphp-theming.md`, end of "Migrating to Twig templates"; `Template.php:268`). A page that extends `@__parent__/_shell.twig` would make the shell non-overridable. **[source]**, not run.
- Things a theme still does to any `Template`, own shell or not: **[source]**
  - `theme.controller`: its `setUpTwig()` and `display(&$data)` run for every template (`Template.php:151-164`, `:379-381`, `:560-562`).
  - Translation domain: when `theme.use` names a module other than the page's, that theme module becomes the default gettext domain (`Template.php:317-320`). Untagged `trans` strings in Console templates would be looked up in the theme's catalog first.
- Twig runs with `strict_variables` (`Template.php:326`): an undefined variable is an error.

## 2. Static assets

- Files live in the module's `public/assets/`. `{{ asset('css/x.css', 'console') }}` returns `Module::getModuleURL('console/assets/css/x.css')` plus `?tag=<5 hex chars>`, an HMAC-SHA256 of the file contents keyed with `assets.salt` (core `src/SimpleSAML/XHTML/Template.php:182-220`; core `config/config.php.dist:949-961`). A missing file yields the URL without tag, no error. **[source]**
- The URL is absolute, built from `Utils\HTTP::getBaseURL()`: `<base URL>module.php/<module>/assets/<path>` (core `src/SimpleSAML/Module.php:519-529`). **[run]**
- `url(...)` references inside a stylesheet are not rewritten; relative ones (`../fonts/x.woff2`) resolve against the stylesheet URL and get no cache-busting tag. **[run]** for resolution.
- Serving: the request enters `public/module.php`, boots the module's Symfony kernel, finds no route, and falls back to reading the file from `modules/<module>/public/` (core `src/SimpleSAML/Module.php:237-289`). Every asset request therefore runs PHP and a kernel boot. A module route matching `/assets/...` would shadow the files. **[source]**
- Content type comes from a fixed extension table: `css`, `js` (`text/javascript`), `svg`, `png`, `gif`, `jpg`, `ico`, `html`, `txt`, `pdf` and a few more (core `src/SimpleSAML/Module.php:68-89`). **No font extension is in the table.** Anything else falls back to `mime_content_type()`, or `application/octet-stream` when the `fileinfo` extension is missing (`:314-334`). **[source]**
- Observed headers for a `.woff2` under PHP 8.4 with `fileinfo`: `Content-Type: font/woff2`. For `.css`: `text/css; charset=utf-8`; `.js`: `text/javascript; charset=utf-8`; `.svg`: `image/svg+xml`. **[run]**
- Caching: `Cache-Control: max-age=86400, public` (configurable as `assets.caching.max_age`), `Last-Modified`, conditional requests answered with 304, `ETag` only when `assets.caching.etag` is true (core `src/SimpleSAML/Module.php:337-354`; core `config/config.php.dist:967-983`). **[run]** for the defaults and the 304.
- Asset responses also carry the security headers of section 3, since they leave through `public/module.php`. **[run]**
- A second path exists: `asset()` prefers `<ssp>/public/assets/<module>/` when that directory exists (`Template.php:189-191`), which the web server serves directly without PHP. Only a separate Composer package named `<vendor>/simplesamlphp-assets-<name>` is installed there (installer `src/ModuleInstaller.php:47`, `:106-110`); core's own assets arrive this way as `simplesamlphp-assets-base` into `public/assets/base/`. **[source]**

## 3. Security headers

- Defaults, `Configuration::DEFAULT_SECURITY_HEADERS` (core `src/SimpleSAML/Configuration.php:49-64`): **[source]**

  ```text
  Content-Security-Policy: default-src 'none'; frame-ancestors 'self'; object-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; connect-src 'self'; media-src data:; img-src 'self' data:; base-uri 'none'
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: origin-when-cross-origin
  ```

- The deployer replaces the whole set with `headers.security`; the same values sit commented out in core `config/config.php.dist:276-299`. **[source]**
- Applied in the front controllers, not in the kernel: `public/module.php:15-23` adds each header to the response **unless the response already has it**. A controller can therefore set its own CSP on its own responses (precedent: core `modules/admin/src/Controller/Config.php:181-187`, the `phpinfo` page). It cannot do so for assets served by the fallback. **[source]**
- Against that policy: **[run]** unless noted

  | Resource | Directive | Result |
  | --- | --- | --- |
  | Module stylesheet via `<link>` | `style-src 'self'` | allowed |
  | Module script via `<script src>` | `script-src 'self'` | allowed |
  | Module woff2 via `@font-face` | `font-src 'self'` | allowed, font loaded |
  | Module SVG via `<img>` and `<link rel="icon">` | `img-src 'self'` | allowed |
  | `data:` image in `<img>` and in CSS `url()` | `img-src data:` | allowed |
  | Inline `<svg>` with presentation attributes | none applies | rendered |
  | `fetch()` to the same origin | `connect-src 'self'` | allowed **[source]**, not run |
  | Inline `<script>` | `script-src 'self'` | **blocked** |
  | `style="…"` attribute | `style-src 'self'` | **blocked** |
  | `<style>` element | `style-src 'self'` | blocked **[source]**, not run |
  | Stylesheet or font from another origin (Google Fonts) | `style-src`, `font-src` | blocked **[source]**, not run |
  | `<base>` | `base-uri 'none'` | blocked **[source]**, not run |

- `form-action` is not set and does not fall back to `default-src`, so form posts are unrestricted. **[source]** (CSP semantics), not run.
- Core's upgrade notes ask modules to move inline CSS and JavaScript to files rather than relax the policy (core `docs/simplesamlphp-upgrade-notes-2.1.md:19-24`; core `docs/simplesamlphp-theming.md:37-44`). **[source]**
- `'self'` matches because asset URLs are built from the configured base URL. A base URL whose origin differs from the page's breaks core's own assets equally. **[unverified]**

### What this means for the design boards

- `Sidebar.dc.html` and `Main.dc.html` load Inter (400-700) and JetBrains Mono (400, 500) from `fonts.googleapis.com`. Blocked; the fonts must be self-hosted or dropped for the system stacks already declared as fallback in `console.css:26-27`. **[source]**
- The boards carry layout in `style="…"` attributes (39 in `Main.dc.html`, most of `Sidebar.dc.html`). Blocked; every one has to become a class in the stylesheet. This matches the map's "no inline scripts or styles". **[source]**
- Icons are inline `<svg>` with `fill`/`stroke` attributes. Fine as drawn. **[source]**

## 4. What a page loses by not extending `base.twig`

From core `templates/base.twig:1-33`, `templates/_header.twig`, `templates/_footer.twig` and assets-base. **[source]**

| Lost | Where it comes from | Can the Console rebuild it |
| --- | --- | --- |
| Core stylesheet (Pure CSS grid, Font Awesome icons, `--ssp-chrome-*` colours) | `base.twig:9` | Not wanted; own stylesheet |
| `js/bundle.js`: language selector auto-submit, clipboard buttons, expander, highlight.js | `base.twig:30`; assets-base `resources/js/bundle/*.js` | Own script |
| Deployer's `_head.twig` injection (documented way to restyle core without a theme) | `base.twig:12`; core `docs/simplesamlphp-theming.md:7-36` | Optional: `{{ include('_head.twig', ignore_missing = true) }}`, as `post.twig:11` does |
| Header text from `theme.header`, and any themed `_header.twig` | `base.twig:17`; `Template.php:535` | `header` variable is still in the context |
| Language selector markup | `_header.twig:16-73` | Yes, see section 5 |
| Footer (copyright, logo), and any themed `_footer.twig` | `base.twig:28` | Not wanted |
| `<html lang dir>` from `currentLanguage` / `isRTL` | `base.twig:2` | Globals are still available |
| `<title>{{ pagetitle }}</title>`, favicon, `robots noindex`, viewport meta, `<body id="{{ templateId }}">` | `base.twig:4-15` | One line each; `asset('icons/favicon.ico')` returns core's favicon |
| Blocks `preload`, `header`, `content`, `contentwrapper`, `footer`, `postload` that themes and child templates rely on | `base.twig` | Own blocks |

Not lost, because `base.twig` never had them:

- **Admin tab bar and `AdminMenuEvent`.** They come from `SimpleSAML\Module\admin\Controller\Menu::insert()` plus `@admin/includes/menu.twig`, called by admin controllers only (core `modules/admin/src/Controller/Menu.php:30-46`, `:89-97`). From another module, `(new Menu())->insert($template)` fills `$template->data['menu']` with `main`, `test`, `federation` (id, absolute URL, untranslated name) plus whatever listeners add, and an own shell can render that array as it likes. **[run]** This closes the open point in `admin-integration.md` section 4. `Menu` is `final` and undocumented as API.
- **Logout link.** Admin controllers add it themselves with `Utils\Auth::getAdminLogoutURL()` (core `modules/admin/src/Controller/Config.php:92`, `:107`; core `src/SimpleSAML/Utils/Auth.php:26-30`), which yields `module.php/core/logout/admin?ReturnTo=<current URL>` (core `src/SimpleSAML/Auth/Simple.php:335-347`). **[run]**
- **Header and footer hooks.** None exist in 2.5. `htmlinject` and `frontpage` were removed in 2.0 ("use a Twig template override instead", core `docs/simplesamlphp-upgrade-notes-2.0.md:89-91`). The only injection points are template overrides and `_head.twig`. **[source]**
- **The non-production banner.** `isProduction` is used only by login templates (core `modules/core/templates/loginuserpass.twig:10`), not by `base.twig`. **[source]**

`Template::twigDefaultContext()` runs for every template regardless of what it extends, so `languageBar`, `hideLanguageBar`, `pagetitle` (default `SimpleSAMLphp`), `header` and `year` are always in the context (core `src/SimpleSAML/XHTML/Template.php:508-536`, `:556-558`). **[run]**

## 5. Languages

- Available languages: `language.available` filtered against the locales Symfony knows (core `src/SimpleSAML/Locale/Language.php:189-240`); 40 in the shipped config (core `config/config.php.dist:847-851`). **[source]**
- From a controller: `$template->getTranslator()->getLanguage()` returns the `Language` object; `getLanguageList()` gives `[code => isCurrent]`, `getLanguage()` the current code, `getLanguageLocalizedName($code)` the display name, `isLanguageRTL()` the direction (`Language.php:287-324`, `:334`, `:432-449`). **[run]** for the list.
- From a template, without controller code: `languageBar` is `[code => ['name' => …, 'url' => '?language=<code>' or false for the current one]]`, sorted by code, `null` when only one language is available; globals `currentLanguage`, `isRTL`, `languageParameterName`, `queryParams` (`Template.php:344-355`, `:477-502`). **[run]**
- Current language is resolved in this order: `?language=` parameter, `language.get_language_function`, the `language` cookie, `Accept-Language`, `language.default` (`Language.php:175-180`, `:287-324`). **[source]**
- Switching is a plain GET with `?language=<code>` on any page. The `Language` constructor handles it and sets the site-wide `language` cookie (`Language.php:175-180`, `:265-273`). **[run]** No script is needed; core's selector only auto-submits its form through `bundle.js`.
- Pinning: there is no per-module switch. **[run]**
  - `setLanguage('en', false)` after the `Template` exists changes `getLanguage()` but not the Twig globals `currentLanguage` and `isRTL`, which were fixed in the constructor (`Template.php:346-350`).
  - A request with `?language=he` to a Console URL still sets the cookie and flips `isRTL`, whatever the controller does afterwards.
  - An English-only shell that prints `lang="{{ currentLanguage }}" dir="{{ isRTL ? 'rtl' : 'ltr' }}"` would announce Hebrew and render right-to-left around English text. Hard-coding `lang="en" dir="ltr"` in the shell avoids it.
- Console strings need no catalog to stay English: `trans` returns the message id when no translation exists. The theme-domain caveat of section 1 applies. **[source]**

## 6. Fonts

- Core ships exactly one font: `webfonts/fa-solid-900.woff2` (Font Awesome), referenced from `css/stylesheet.css` with a relative `@font-face` URL (assets-base tree; `public/assets/base/css/stylesheet.css` after install). It is served by the web server as a static file under `public/assets/base/`, never through PHP. **[source]**, **[run]** for its presence after `composer install`.
- No module under `simplesamlphp/` was found shipping a font, and oidc ships one stylesheet and two scripts, no fonts (oidc `public/assets/`). The check was oidc by clone plus GitHub code search over the organisation, which does not index binaries; treat "none" as **[unverified]**.
- A module font is just another file in `public/assets/`, referenced from the module stylesheet with a relative URL. It loads under the default CSP. **[run]**
- Its MIME type depends on `fileinfo` (section 2). Without it the font is served as `application/octet-stream`; browsers apply `nosniff` to scripts and styles only, so the font should still load. **[unverified]**

## 7. Departure from official module conventions

Followed without change: Composer packaging, routes and controllers, the `Template` class, `asset()` with files under `public/assets/`, no inline CSS or JavaScript, admin entry through an event listener.

Departures, with the precedent each one breaks:

1. **Not extending `base.twig`.** Every UI page of core modules and of oidc extends it; oidc layers its own `@oidc/base.twig` on top of core's and fills `preload`, `content` and `postload` (oidc `templates/base.twig:6-11`, `:48-53`). The only standalone documents found are auto-submit pages without chrome: core `templates/post.twig`, `modules/exampleauth/templates/authenticate.twig`, adfs `templates/postResponse.twig`, negotiate `templates/redirect.twig` (organisation code search for `<!DOCTYPE html>` in Twig files; five hits). **[source]**, search coverage **[unverified]**.
2. **Not using core's stylesheet** (Pure CSS, Font Awesome, `--ssp-chrome-*` variables). oidc loads `admin.css` and adds a small stylesheet of its own. A deployer's colour customisation through `_head.twig` or a theme will not reach the Console.
3. **Shipping fonts.** No precedent in a module.
4. **Not rendering the admin tab bar** (`@admin/includes/menu.twig`), which oidc includes. The same data can feed the Console's sidebar (section 4).
5. **Ignoring theme chrome.** Under a branded theme the Console keeps its own look while the rest of SimpleSAMLphp follows the theme. A theme can still override Console templates one by one.

## Candidate approaches

| | A. Own shell, standalone | B. Extend `base.twig`, override `header`, `contentwrapper`, `footer` |
| --- | --- | --- |
| Works under any theme | Yes: loads nothing a theme replaces **[run]** | Only while the theme's `base.twig` keeps those block names; a theme may replace `base.twig` wholesale **[source]**, not run |
| Core stylesheet and `bundle.js` | Not loaded | Always loaded; Pure CSS resets and `#layout` / `.wrap` wrappers have to be fought |
| Deployer's `_head.twig` | Lost unless included on purpose | Kept |
| Convention | Departs (section 7, points 1-5) | Departs less (points 2-5 remain if the look is the design's) |
| Design fidelity | Full control | Constrained by core markup around the content |

Sub-choices under A, independent of each other:

- **Fonts:** self-host Inter and JetBrains Mono as woff2 in `public/assets/` (works, adds binaries and their licence files to the package), or use the system stacks already in `console.css` (no files, look varies by platform).
- **`_head.twig`:** include it with `ignore_missing` to keep the deployer's injection point, or leave it out because its documented use is recolouring core's stylesheet.
- **Language selector:** render it from `languageBar` (it changes the language of core pages only, while the Console stays English), or omit it in v1.
- **Shell overridable by themes or not:** `@console/_shell.twig` (overridable) versus `@__parent__/_shell.twig` (fixed).
- **Core admin links:** take them from `Menu::insert()` (follows listeners of other modules, relies on a `final` undocumented class) or hard-code the three admin URLs.

The facts favour A for the ticket's requirement "work under any installed theme": it is the only variant that does not depend on what a theme does to `base.twig`.

## Verification run

Throwaway `php:8.4-cli-alpine` container (PHP 8.4.28, `intl`, `bcmath`, `fileinfo`), core at the commit above after `composer install --no-dev` (assets-base v2.5.15), served by PHP's built-in web server with `public/` as document root and `baseurlpath => '/'`. `config.php` was the `.dist` file with a cache directory, a salt and two extra enabled modules. Removed afterwards.

Module `shelltest`, placed by hand in `modules/`:

- `templates/_shell.twig`: a complete HTML document that does not extend `base.twig`; links `asset('css/app.css', 'shelltest')`, an SVG favicon and `asset('js/app.js', 'shelltest')`; contains an inline `<svg>`, a `data:` `<img>`, and two controls expected to fail (an inline `<script>` and a `style` attribute).
- `templates/page.twig`: `{% extends "@shelltest/_shell.twig" %}`.
- `public/assets/css/app.css` with `@font-face { src: url("../fonts/test.woff2") }` and a `data:` background image; `public/assets/fonts/test.woff2` (a copy of core's Font Awesome file); `public/assets/js/app.js`, which records `securitypolicyviolation` events, computed styles and `document.fonts.load()` into `<body>` attributes.

Module `themetest` with theme `fancy`: `themes/fancy/default/_header.twig`, later also `themes/fancy/shelltest/_shell.twig`.

Two servers: `theme.use = default` and `theme.use = themetest:fancy`. Pages loaded with headless Chrome (`--dump-dom`, console log captured) and with `curl`.

Results:

- Default theme and `themetest:fancy`: the page rendered with its own shell; external script ran; stylesheet applied; font loaded (`document.fonts.check` true); both images loaded. The only CSP console messages were the two controls: inline script blocked, `style` attribute blocked.
- `themetest:fancy` did take effect on core pages: `core/welcome` showed the themed header.
- With `themes/fancy/shelltest/_shell.twig` present, the themed server rendered the theme's shell around the module's content block; the default-theme server kept the module's shell.
- Response headers of page and assets as quoted in sections 2 and 3; conditional request returned 304; missing asset 404.
- `Accept-Language: es` gave `currentLanguage=es`; `?language=he` gave `lang="he" dir="rtl"` and a `Set-Cookie: language=he`; calling `setLanguage('en', false)` in the controller changed `getLanguage()` to `en` but left the globals at `he` / RTL.
- `languageBar` was present in the context with 40 entries.
- `(new Menu())->insert($template)` from the test module returned the three admin entries; `getAdminLogoutURL()` returned the `core/logout/admin` URL.

Not verified:

- A real web server (Apache, nginx with PHP-FPM); in particular how it serves `public/assets/base/` and whether it adds or strips headers.
- Browsers other than Chrome.
- A deployer-modified `headers.security`, stricter or looser.
- A PHP build without `fileinfo`.
- `theme.controller`, `@__parent__`, approach B, and a theme that replaces `base.twig` wholesale.
- The module installed through Composer rather than copied into `modules/`.
- A base URL behind a reverse proxy.
- Font licences and file sizes.
- An exhaustive survey of official modules; only oidc was read in full.
