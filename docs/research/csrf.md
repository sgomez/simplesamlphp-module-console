# CSRF protection available to a SimpleSAMLphp 2.5 module

Research for issue #28. Baseline: SimpleSAMLphp 2.5 (`composer.json` reports `2.5.4`), PHP 8.4.

This document reports facts and options. It does not choose a mechanism.

## Sources

Paths are relative to the repository or package named. Line numbers refer to the commit or version named.

| Short name | Source | Ref |
| --- | --- | --- |
| core | `simplesamlphp/simplesamlphp` | branch `simplesamlphp-2.5`, commit `6e34a73985f63aac5326e0c1f416bf3efc047c90` |
| oidc | `simplesamlphp/simplesamlphp-module-oidc` | default branch, commit `f813c29280c3f8cceb883a637af7838e6079d669` (tag `v6.5.0`) |
| metaedit | `simplesamlphp/simplesamlphp-module-metaedit` | `master`, commit `bec79c81737d816a5b5130221ae4ccff1e1e3d62` |
| consentadmin | `simplesamlphp/simplesamlphp-module-consentadmin` | `master`, commit `18218442f992f6355a905c9bce49436edd70cdc1` |
| framework-bundle | `symfony/framework-bundle` | `v7.4.23`, as installed by core's `composer.lock` |
| security-csrf | `symfony/security-csrf` | `v7.4.8`, installed with `composer require "symfony/security-csrf:~7.4"` |
| http-foundation | `symfony/http-foundation` | `v7.4.23` |
| Symfony docs | <https://symfony.com/doc/7.4/security/csrf.html> | read 2026-11-24 |
| OWASP | <https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html> | read 2026-11-24 |
| MDN | <https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Site> | read 2026-11-24 |

Claims are tagged **[source]** (read in the code or docs), **[run]** (executed, see "Verification run") or **[unverified]** (inference, not checked).

## Summary

1. `symfony/security-csrf` installs next to core 2.5 and its classes work inside the module kernel. The FrameworkBundle switch `framework.csrf_protection: true` does not: it needs Symfony's session, which the kernel does not have and cannot use.
2. Symfony's session cannot be enabled in a useful way. Core replaces `http_kernel` with one bound to a private event dispatcher that carries only the router and response listeners, so no FrameworkBundle listener runs (`SessionListener` included).
3. Two Symfony-based setups do work, both verified: `CsrfTokenManager` with a custom `TokenStorageInterface` backed by `SimpleSAML\Session`, and the stateless `SameOriginCsrfTokenManager`. The second works only partially: its response listener never runs.
4. `oidc` protects its one Nette form with a token stored in the SimpleSAMLphp session. Its other state-changing POST actions have no CSRF token. `metaedit` and `consentadmin` have no CSRF protection at all, and both change state on GET.
5. The SimpleSAMLphp session cookie defaults to `SameSite=None`, so the cookie attribute gives no CSRF protection and the module cannot change that.
6. Four candidate mechanisms are listed in section 6 with their trade-offs.

## 1. What the module kernel provides

- The kernel registers a single bundle, `FrameworkBundle` (core `src/SimpleSAML/Kernel.php:96-101`), and configures only `framework.secret` (core `src/SimpleSAML/Kernel.php:131-133`). **[source]**
- Core's `composer.json` requires no `symfony/security-*`, `symfony/form` or `symfony/twig-bundle` package (core `composer.json:80-103`). A search of `src/`, `modules/`, `templates/`, `routing/` and `docs/` for `csrf`, `Sec-Fetch` and `HTTP_ORIGIN` returns nothing. **[source]**
- A module's `routing/services/**/*.{php,xml,yaml,yml}` is loaded into the container, and it may contain a `framework:` extension block as well as `services:` (core `src/SimpleSAML/Kernel.php:121-129`). **[source]** **[run]**
- Core defines its own `dispatcher` service with exactly two subscribers, `router_listener` and `response_listener`, and its own `http_kernel` built on it (core `routing/services/services.yml:18-34`). The compiled container confirms that `http_kernel` uses this dispatcher, while listeners tagged `kernel.event_listener` are attached to FrameworkBundle's separate `event_dispatcher`. **[source]** **[run]**
- Consequence: no FrameworkBundle or third-party kernel listener runs during a module request. This covers `SessionListener`, `#[IsCsrfTokenValid]` handling and the `kernel.response` hook of `SameOriginCsrfTokenManager`. **[run]** for the last one, **[unverified]** for the other two beyond the session failure in section 3.
- Templates are rendered by a Twig environment that `SimpleSAML\XHTML\Template` builds itself (core `src/SimpleSAML/XHTML/Template.php:298-380`), not by a container service. The `csrf_token()` Twig function from `symfony/twig-bridge` is therefore absent; a token has to be passed in `$t->data` or registered through `$t->getTwig()` (core `src/SimpleSAML/XHTML/Template.php:626`). **[source]**

## 2. SimpleSAMLphp session versus Symfony session

- `SimpleSAML\Session` is injected from the factory `Session::getSessionFromRequest()` (core `routing/services/simplesamlphp.yml:11-12`). It is unrelated to `Symfony\Component\HttpFoundation\Session`: the request has no Symfony session (`$request->hasSession()` is `false`). **[source]** **[run]**
- It offers a per-session key/value store: `setData($type, $id, $data, $timeout)`, `getData($type, $id)`, `deleteData($type, $id)` (core `src/SimpleSAML/Session.php:868`, `:895-933`, `:972-996`). The default timeout is `session.datastore.timeout` (4 hours); `Session::DATA_TIMEOUT_SESSION_END` keeps the entry for the life of the session. **[source]**
- `setData()` marks the session dirty; the session is saved by a `header_register_callback` hook, before headers go out (core `src/SimpleSAML/Session.php:503-516`). The session cookie is set in the constructor of a new session (core `src/SimpleSAML/Session.php:172-174`). No explicit save is needed in a controller. **[source]** **[run]**
- A transient session (cookie could not be set) ignores `markDirty()` (core `src/SimpleSAML/Session.php:505-507`), so data stored in it is lost. An administrator cannot be logged in on a transient session either. **[source]**
- The store behind the session depends on `store.type`. With `phpsession` the cookie is `session.phpsession.cookiename` (default `SimpleSAML`) and the native PHP session is active; with `sql` the cookie is `session.cookie.name` (default `SimpleSAMLSessionID`) and no PHP session is started (core `config/config.php.dist:617`, `:682`). **[source]** **[run]**
- The session cookie's `SameSite` defaults to `None` where the browser supports it, because SAML POST bindings need cross-site delivery (core `config/config.php.dist:660-677`). Observed header: `Set-Cookie: SimpleSAML=...; path=/; secure; HttpOnly; SameSite=None`. A cross-site POST to the Console therefore carries the administrator's session. **[source]** **[run]**

## 3. Symfony's CSRF component inside the module kernel

### Installation

- `composer require symfony/security-csrf` without a constraint resolves to `v8.1.0`, next to a 7.4 FrameworkBundle. With `~7.4` it resolves to `v7.4.8`. FrameworkBundle 7.4 only conflicts with `symfony/security-csrf <7.2` (framework-bundle `composer.json:101`), so the mix is allowed but untested here. **[run]**
- It pulls in `symfony/security-core` (security-csrf `composer.json:18-21`), which resolved to `v8.1.11` even with security-csrf pinned to 7.4. **[run]**
- Installing the package changes nothing by itself: `framework.csrf_protection.enabled` defaults to `stateless_token_ids || session.enabled`, and both are off (framework-bundle `DependencyInjection/FrameworkExtension.php:584`). No `CsrfTokenManagerInterface` service exists. **[source]** **[run]**

### `framework.csrf_protection: true`

- Fails at container build with `LogicException: CSRF protection needs sessions to be enabled.` (framework-bundle `DependencyInjection/FrameworkExtension.php:2101-2103`). Every request to the module returns 500. **[run]**

### `framework.session.enabled: true` plus `csrf_protection: true`

- The container builds, but the first `getToken()` fails with `There is currently no session available.` The default storage `SessionTokenStorage` asks `RequestStack::getSession()` (framework-bundle `Resources/config/security_csrf.php:30-31`; http-foundation `RequestStack.php:109-116`), and nothing has attached a session to the request because `SessionListener` is not on core's dispatcher (section 1). **[run]**
- Getting past this would mean attaching a Symfony session to the request by hand and running a second session, with its own cookie, beside SimpleSAMLphp's. With `store.type = phpsession` both would compete for the single native PHP session. **[unverified]**

### `CsrfTokenManager` with storage in the SimpleSAMLphp session

- Works. Three services in the module's `routing/services/services.yml`: a ~35-line class implementing `TokenStorageInterface` (`getToken`, `setToken`, `hasToken`, `removeToken`) over `Session::getData/setData/deleteData`, `UriSafeTokenGenerator`, and `CsrfTokenManager` aliased to `CsrfTokenManagerInterface`. Controllers get the manager by autowiring. **[run]**
- Verified with `store.type = phpsession` and `store.type = sql` (SQLite): the issued token validates in the same session (200) and is rejected with a wrong value, without the session cookie, or from another session (403). `Origin` and `Sec-Fetch-Site` play no part. **[run]**
- `CsrfTokenManager` returns a differently masked value on every `getToken()` call for the same stored token (two GETs, two values, both valid). This is its defence against compression side channels ("CSRF Tokens and Compression Side-Channel Attacks" in the Symfony docs). It compares with `hash_equals`. **[run]** **[source]**

### `SameOriginCsrfTokenManager` (stateless, Symfony 7.2+)

- Works in two ways, with identical results: `framework.csrf_protection.stateless_token_ids: [<id>]`, which makes it the token manager when the session is disabled (framework-bundle `DependencyInjection/FrameworkExtension.php:2112-2128`), or declared directly as a service with `@request_stack` as its only argument. **[run]**
- `getToken()` returns the constant cookie name, `csrf-token` by default; nothing is stored. Validation (security-csrf `SameOriginCsrfTokenManager.php:116-166`, `:236-257`, `:262-292`): **[source]** **[run]**

  | Request | Result |
  | --- | --- |
  | `Sec-Fetch-Site: same-origin` | accepted |
  | `Sec-Fetch-Site: cross-site` or `same-site` | rejected |
  | No `Sec-Fetch-Site`, `Origin` or `Referer` equal to the request's own scheme and host | accepted |
  | Foreign `Origin`, or `Origin: null` | rejected |
  | None of the three headers, token is the placeholder | rejected |
  | None of the three headers, a 24+ character token sent both as the form field and as cookie `csrf-token_<token>=csrf-token` | accepted (double submit) |
  | Same, without the cookie | rejected |

- The target origin is `Request::getSchemeAndHttpHost()` (security-csrf `SameOriginCsrfTokenManager.php:242`). It ignores `baseurlpath`, and core never calls `Request::setTrustedProxies()`. Behind a TLS-terminating proxy, a request with `Origin: https://host` and `X-Forwarded-Proto: https` but no `Sec-Fetch-Site` is rejected; the same request with `Sec-Fetch-Site: same-origin` is accepted. It fails closed, not open. `framework.trusted_proxies` could be set from the module's service file, but that is deployment configuration. **[run]** for the behaviour, **[unverified]** for `trusted_proxies`.
- The double-submit path needs a JavaScript snippet that generates the token on submit and writes the field and the cookie (Symfony docs, "Generating a CSRF Token Using JavaScript"). The Console's single JS file would have to carry it. **[source]**
- The manager's `kernel.response` listener (security-csrf `SameOriginCsrfTokenManager.php:223`; framework-bundle `Resources/config/security_csrf.php:62`) never runs: after a successful double submit the response carries no `Set-Cookie` clearing `csrf-token_*`. The other half of that listener, remembering in the Symfony session which method succeeded so a later request cannot downgrade, has no session to write to. **[run]** **[source]**
- `Sec-Fetch-Site` is sent only to potentially trustworthy URLs (HTTPS, `localhost`) and is Baseline "widely available" since March 2023 (MDN). First versions: Chrome 76, Edge 79, Firefox 90, Safari 16.4. **[source]** for Baseline and secure contexts, **[unverified]** for the version numbers (the compatibility table did not load).

## 4. What `oidc` does

- The client form is a Nette form (`nette/forms ^3`, oidc `composer.json:30`). It carries a CSRF control that subclasses Nette's `CsrfProtection` and deliberately skips the parent constructor so that no Nette session is created (oidc `src/Forms/Controls/CsrfProtection.php:41-61`). **[source]**
- The token is a random string stored once per session with `Session::setData('form_csrf', 'token', ...)` and XORed with the session id before being rendered (oidc `src/Forms/Controls/CsrfProtection.php:66-76`). The control is added to the form in `ClientForm` (oidc `src/Forms/ClientForm.php:356`) and built in the module's own service container (oidc `src/Services/Container.php:151-161`). On failure the user sees "Your session has expired. Please return to the home page and try again." **[source]**
- Only add and edit go through that form (oidc `src/Controllers/Admin/ClientController.php:165`, `:243`). The other state-changing actions are POST-only routes (oidc `routing/routes/routes.php:34-36`, `:55-60`) without a CSRF token: **[source]**
  - `delete` and `resetSecret` compare a hidden `secret` field with the client's stored secret (oidc `src/Controllers/Admin/ClientController.php:106-114`, `:133-141`; oidc `templates/clients.twig:73`). The client secret works as an unguessable per-object token, by side effect.
  - `runMigrations` checks nothing (oidc `src/Controllers/Admin/ConfigController.php:43-56`; oidc `templates/config/migrations.twig:16-20`).
- `oidc` uses no Symfony CSRF class, no `Origin` check and no `Sec-Fetch-Site` check. **[source]**

## 5. Other official modules

- A code search for `csrf` across the `simplesamlphp` GitHub organisation returns only `oidc` files, plus specification texts and `composer.lock`. **[run]**
- `metaedit`: deletion is a GET, `?delete=<entityid>`, guarded by ownership only (metaedit `src/Controller/MetaEditor.php:104-108`). Editing is a POST without a token (metaedit `src/Controller/MetaEditor.php:193-199`). Its routes declare no `methods`. **[source]**
- `consentadmin`: consent is granted and revoked by GET, `?cv=<sp>&action=true|false` (consentadmin `src/Controller/ConsentAdmin.php:200-201`, `:245-251`; consentadmin `routing/routes/routes.yml:8`, `:15`). **[source]**
- Core `admin` and `cron` routes are GET only (core `modules/admin/routing/routes/routes.yml`, `modules/cron/routing/routes/routes.yml`). **[source]**
- There is no precedent in the official modules beyond `oidc`'s session token.

## 6. Candidate mechanisms

Common ground: the Console always has an authenticated SimpleSAMLphp session (`requireAdmin()`), its cookie is `SameSite=None` by default, and no kernel listener can be used, so each controller action (or a shared helper it calls) has to perform the check explicitly.

OWASP's position, for reference: stateful software should use the synchronizer token pattern; stateless software a signed double-submit cookie bound to the session; the naive double-submit cookie is discouraged; Fetch Metadata may be relied on for modern browsers together with a fallback to origin verification, served over HTTPS; a missing header or `Origin: null` is not evidence of a same-origin request; SameSite is defence in depth only. **[source]**

### A. Hand-written synchronizer token in the SimpleSAMLphp session

The `oidc` approach without Nette: `random_bytes` token stored with `Session::setData()`, rendered in a hidden field, compared with `hash_equals`.

- No new dependency. Works with every `store.type`, since it uses the same `Session` calls verified in B. **[unverified]** as written (B exercised the same API through Symfony's manager).
- Independent of browser headers, proxies and `baseurlpath`.
- Every form needs the hidden field; requests sent from JS need the token exposed in the page (for example a `data-` attribute).
- One session write per session. A token outliving the 4-hour default needs `DATA_TIMEOUT_SESSION_END`.
- Masking against compression side channels and per-form token ids would have to be written by hand if wanted.

### B. Symfony `CsrfTokenManager` over a SimpleSAMLphp-session `TokenStorageInterface`

- Verified with `phpsession` and `sql` stores. Same security model as A.
- Adds `symfony/security-csrf` and, transitively, `symfony/security-core`. Must be constrained to `~7.4` to match core; an unconstrained require picks 8.x.
- Brings per-id tokens, masking on every render and constant-time comparison, maintained upstream.
- Module-owned code: the storage adapter (~35 lines) and three service definitions.
- `csrf_token()` in Twig and `#[IsCsrfTokenValid]` are not available; token goes through `$t->data`, validation is an explicit call.

### C. Symfony `SameOriginCsrfTokenManager`

- Verified. No session data, no per-form token: the hidden field holds a constant, or can be omitted if the action passes the placeholder itself. **[run]** for the field, **[unverified]** for omitting it.
- Same dependencies and version constraint as B.
- Decides on `Sec-Fetch-Site`, then `Origin`/`Referer`. Behind a TLS-terminating proxy the `Origin` fallback rejects legitimate requests unless trusted proxies are configured, so browsers that send no `Sec-Fetch-Site` (plain-HTTP deployments, pre-2023 Safari) are locked out there.
- Runs degraded in this kernel: the cookie-clearing and anti-downgrade listener does not fire.
- Double submit, the only path for requests carrying none of the headers, needs JavaScript in the Console's JS file.

### D. Hand-written `Sec-Fetch-Site` / `Origin` check

Accept a non-safe request when `Sec-Fetch-Site` is `same-origin`; when the header is absent, require `Origin` to equal the module's own origin; reject otherwise.

- No dependency, no session data, no template change. Not run here. **[unverified]**
- The own origin can come from `Utils\HTTP::getSelfURLHost()`, which honours a full URL in `baseurlpath` (core `src/SimpleSAML/Utils/HTTP.php:684-700`, `:895-905`), avoiding C's proxy problem where `baseurlpath` is set that way. **[source]** for the helper, **[unverified]** for the combination.
- Relies entirely on browser-supplied headers: no second factor if a browser omits or mishandles them. OWASP accepts this for modern browsers with HTTPS enforced and an origin fallback.
- `same-site` must be rejected unless sibling subdomains are trusted.

### Not a candidate on its own

- Signed double-submit cookie: OWASP recommends it for stateless software. The Console always has a server-side session, so it adds a cookie and a signing step to reach what A or B give directly. A variant that derives the token as an HMAC of the session id with `secretsalt` needs neither cookie nor session write; it was not examined. **[unverified]**
- `SameSite` on the session cookie: `None` by default and owned by the deployment (section 2).

A and B can be combined with D as a second layer; C already includes D's logic.

## Verification run

Environment: throwaway container, PHP 8.4.28, core at the commit above with `composer install --no-dev`, then `composer require "symfony/security-csrf:~7.4"`. Served with `php -S` from `public/`, `baseurlpath = http://localhost:8080/`, exercised with `curl`. Nothing was kept.

Test module `csrftest`: routes `GET /form` and `POST /submit`; a controller with constructor `(Session $session, ?CsrfTokenManagerInterface $csrf = null)` that reports the manager class and a token for id `console`, and validates the `_token` field. The module's `routing/services/services.yml` was swapped per scenario and the container cache cleared.

| # | `routing/services/services.yml` | Outcome |
| --- | --- | --- |
| 1 | no CSRF configuration | manager is `null` |
| 2 | `framework: { csrf_protection: true }` | 500, `CSRF protection needs sessions to be enabled.` |
| 3 | `framework: { csrf_protection: { stateless_token_ids: [console] } }` | `SameOriginCsrfTokenManager`; table in section 3 |
| 4 | `framework: { session: { enabled: true }, csrf_protection: true }` | 500, `There is currently no session available.` |
| 5 | `CsrfTokenManager` + `SspSessionTokenStorage` services | valid in session 200; wrong token, no cookie, other session 403; repeated with `store.type = sql` |
| 6 | `SameOriginCsrfTokenManager` declared as a service | same results as 3 |

Extra checks on scenario 3: `Origin: https://localhost:8080` with `X-Forwarded-Proto: https` gives 403, and 200 once `Sec-Fetch-Site: same-origin` is added; `Referer` alone on the same origin gives 200; `Origin: null` gives 403; a successful double submit returns no `Set-Cookie` for `csrf-token_*`; in the compiled container the manager's `onKernelResponse` is registered on `event_dispatcher` while `http_kernel` is built from core's `dispatcher`.

## Not verified

- Mechanisms A and D as hand-written code, and the HMAC-of-session-id variant.
- Mixing `symfony/security-csrf` 8.x with FrameworkBundle 7.4, and pinning `symfony/security-core` to 7.4.
- `framework.trusted_proxies` set from a module's service file.
- Attaching a Symfony session to the request by hand.
- Browser version numbers for `Sec-Fetch-Site`.
- Behaviour with `store.type` `memcache` or `redis`; only `phpsession` and `sql` were run.
- Installation of the module through Composer into an existing deployment whose lock file already holds other Symfony security packages.
