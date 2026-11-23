# Pest compatibility with the SimpleSAMLphp 2.5 dependency set

Research for issue #9. Checked on 2026-11-23.

## Verdict

- **Pest 5 installs next to `simplesamlphp/simplesamlphp` `^2.5`, but only on PHP 8.4 or newer.** SimpleSAMLphp 2.5 itself accepts PHP 8.3; every Pest 5 package requires `^8.4`. On PHP 8.3 resolution fails.
- **`simplesamlphp/simplesamlphp-test-framework` coexists with Pest 5.** No conflict; it does not have to be dropped.
- **Pest 4 is the only Pest major that installs on PHP 8.3** with the same set (PHPUnit 12 instead of 13).
- No Symfony conflict: the resolver mixes Symfony 7.4 (pinned by SimpleSAMLphp) with Symfony 8.1 for the components SimpleSAMLphp does not pin.

The decision left for the maintainer: develop and run CI on PHP >= 8.4 while the module still declares `php: ^8.3` (then PHP 8.3 is declared but never tested), raise the module's floor to 8.4, or use Pest 4.

## Method

Dependency resolution was executed, not inferred. Throwaway projects of type `simplesamlphp-module`, Composer 2 (latest stable phar), official `php:8.3|8.4|8.5-cli-alpine` images, `composer update --dry-run --ignore-platform-req='ext-*'` (PHP version checked, extensions not). One project was installed for real on PHP 8.4 and a smoke test run. Constraints quoted below come from Packagist metadata (`https://repo.packagist.org/p2/<vendor>/<package>.json`) and the installed packages' `composer.json`.

Root requirements used:

```json
{
  "type": "simplesamlphp-module",
  "require": { "php": "^8.3", "simplesamlphp/simplesamlphp": "^2.5" },
  "require-dev": {
    "pestphp/pest": "^5.0",
    "pestphp/pest-plugin-arch": "^5.0",
    "pestphp/pest-plugin-mutate": "^5.0",
    "pestphp/pest-plugin-browser": "^5.0"
  }
}
```

## Resolution results

| PHP | Dev requirements | Result |
| --- | --- | --- |
| 8.3 | Pest `^5.0` + arch, mutate, browser | **Fails**: `pestphp/pest[v5.0.0, ..., v5.3.7] require php ^8.4` |
| 8.4 | Pest `^5.0` + arch, mutate, browser | Resolves: Pest 5.3.7, PHPUnit 13.4.7, SimpleSAMLphp 2.5.4 |
| 8.4 | same + `simplesamlphp-test-framework` `*` | Resolves: test-framework **1.11.7** |
| 8.5 | same + `simplesamlphp-test-framework` `*` | Resolves: test-framework **2.0.1** |
| 8.3 | Pest `^4.0` + browser `^4.0` + test-framework | Resolves: Pest 4.7.8, PHPUnit 12.5.33, test-framework 1.11.7 |

A real `composer update` on PHP 8.4 (Pest 5 + browser + test-framework + `pestphp/pest-plugin-phpstan`) installed cleanly. A Pest test that autoloads `SimpleSAML\Configuration` and an `arch()` expectation both passed.

Composer older than 2.9 cannot install SimpleSAMLphp 2.5 at all: `simplesamlphp/composer-module-installer` 1.7 requires `composer-plugin-api ~2.9`. Unrelated to Pest, but it bit the first attempt.

## Version constraints

| Package | Version | PHP | PHPUnit |
| --- | --- | --- | --- |
| `simplesamlphp/simplesamlphp` | 2.5.4 | `^8.3` | none at runtime |
| `pestphp/pest` | 5.3.7 | `^8.4` | `^13.4.7`, and `conflict: >13.4.7` (exact pin) |
| `pestphp/pest-plugin-arch` | 5.0.0 | `^8.4` | via `ta-tikoma/phpunit-architecture-test ^0.8.7` |
| `pestphp/pest-plugin-mutate` | 5.0.2 | `^8.4` | `phpunit/php-code-coverage ^14.3.0` |
| `pestphp/pest-plugin-browser` | 5.2.0 | `^8.4` | via `pestphp/pest ^5.2.1` |
| `pestphp/pest` | 4.7.8 | `^8.3` | resolved to 12.5.33 |
| `simplesamlphp/simplesamlphp-test-framework` | 1.11.7 | `^8.3` | `^12.3 \|\| ^13.0` |
| `simplesamlphp/simplesamlphp-test-framework` | 2.0.1 | `^8.5` | `^12.3 \|\| ^13.0` |

Notes:

- `pestphp/pest` 5 already requires the arch and mutate plugins. Only the browser plugin is a separate requirement.
- Pest pins PHPUnit to one exact patch release. Anything else in the tree that needs a newer PHPUnit 13 patch will block until Pest releases. The test framework's `^12.3 || ^13.0` is wide enough not to care.
- SimpleSAMLphp 2.5.4 itself develops against test-framework `~1.11.7 || dev-master`, so 1.11.x is the line matching the 2.5 baseline; 2.0.x needs PHP 8.5.
- The test framework brings PHPStan 2, `phpstan-phpunit`, `phpstan-mockery`, PHP_CodeSniffer 4, `slevomat/coding-standard`, `composer-unused` and `symfony/phpunit-bridge ^8.0`. It does not bring a test runner of its own beyond PHPUnit, so it overlaps with Pest only on PHPUnit.

## Symfony components

SimpleSAMLphp 2.5.4 pins the components it uses to `~7.4`. Pest 5 requires `symfony/process ^8.1.10`, which SimpleSAMLphp does not require. Resolved set on PHP 8.4: `symfony/console`, `http-kernel`, `framework-bundle`, etc. at 7.4.x; `symfony/process`, `string`, `var-dumper`, `error-handler` at 8.1.x. Composer accepted the mix and the smoke test ran. Behaviour of the mixed set under a full SimpleSAMLphp kernel boot was **not verified**.

## Browser plugin runtime needs

From `pestphp/pest-plugin-browser` 5.2.0 source:

- **`ext-sockets` is mandatory.** Without it, any `pest` run crashes at shutdown (`Call to undefined function socket_create_listen()`), even when no browser test exists. Observed in the smoke run, where extensions were ignored at install time.
- **Node.js and Playwright in the project root.** The plugin starts `./node_modules/.bin/playwright run-server`. Its `package.json` requires `playwright ^1.63.0` and the code checks for version 1.63.0; the error message asks for `npm install playwright && npx playwright install`. So the repo gains a `package.json`, a lockfile and downloaded browser binaries in CI.
- **In-process app serving is Laravel-only.** The built-in HTTP server driver is `LaravelHttpServer`, chosen when `app_path()` exists; otherwise a `NullableHttpServer` is used. `ServerManager::setHttpServerFactory()` allows a custom one. For a SimpleSAMLphp module the practical route is visiting an externally started instance by URL (for example the docker-compose environment). **Not verified** by running a browser test.

## Mutation testing

`pest-plugin-mutate` builds on `phpunit/php-code-coverage`, so it needs a coverage driver (Xdebug or PCOV) at runtime. **Not verified** by running it.

## PHPStan on Pest test files

- `pestphp/pest` 5 ships a PHPStan `extension.neon` (registered through `phpstan/extension-installer`, which the test framework already requires). It only declares `Pest\Expectation` and `HigherOrderTapProxy` as universal object crates.
- `pestphp/pest-plugin-phpstan` 5.3.1 is the first-party plugin (requires `pestphp/pest ^5.0.0`, `phpstan/phpstan ^2.2.5`, PHP `^8.4`). It installed next to PHPStan 2.3.7.
- With it, `phpstan analyse tests --level=max` reported no errors on the two-test smoke file. That sample is too small to say how it copes with `$this` in closures, datasets or custom expectations: **unverified**.
- `mrpunyapal/peststan` 0.2.12 is a third-party alternative (PHP `^8.2`, PHPStan `^2.0`). Not tried.
- The map only requires PHPStan max on `src/`, which does not depend on any of this.

## Fallback stack, for comparison

Constraints only, not resolved: `phpat/phpat` 0.12.5 needs PHP `^8.1` and PHPStan `^2.1`; `infection/infection` 0.35.12 needs PHP `^8.3` and accepts Symfony `^7.4 || ^8.0`. Both fit PHP 8.3.

## Not verified

- Running a browser test or a mutation run.
- A full SimpleSAMLphp boot with the mixed Symfony 7.4/8.1 set.
- PHPStan quality on realistic Pest test files.
- Upstream support status of Pest 4.
- Pest's documentation site was not consulted; everything above comes from package metadata, package source and executed commands.
