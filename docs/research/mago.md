# Mago versus PHPStan and the rest of the quality toolchain

Research for issue #24. Checked on 2026-11-23 against Mago 1.61.0 (released 2026-11-21).

## Verdict

| Mago tool | Stands in for | Verdict |
| --- | --- | --- |
| Analyzer (`mago analyze`) | PHPStan max on `src/` | **Do not replace.** Optional second analyzer on `src/` only; never on Pest test files. |
| Linter (`mago lint`) | PHP_CodeSniffer + SimpleSAMLphp ruleset | **Cannot replace.** Optional alongside, with a curated rule set. |
| Formatter (`mago format`) | `phpcbf` with the same ruleset | **Do not adopt** while the module follows the SimpleSAMLphp ruleset: the two disagree on blank lines and cannot be reconciled by configuration. |
| Guard (`mago guard`) | Pest `arch()` / `phpat` | **Not needed if Pest stays.** Credible substitute for `phpat` in the fallback stack. |
| Twig linter and formatter (`mago twig:lint`, `twig:fmt`) | nothing in the assumed harness | Outside the ticket; `twig:lint` is worth a look when the Twig UI is specified. |

Pest collision: **confirmed for installation, linter, formatter and guard; refuted for the analyzer on test files.** Mago installs and runs next to Pest 4 (PHP 8.3) and Pest 5 (PHP 8.4), and formatting or lint-fixing Pest files does not change test results. The analyzer does not understand Pest's runtime binding of `$this` and reports false errors on test files. The map only requires analysis of `src/`, so this does not block anything as long as tests are excluded from `mago analyze`.

Nothing found here is a reason to change the harness the map assumes. Mago's analyzer matched PHPStan max on the sample, but that is a small sample, the 1.x analyzer is scheduled to be superseded in Mago 2.0, and PHPStan is what the SimpleSAMLphp test framework and the Pest and `phpat` integrations are built on.

## Method

Two throwaway projects of type `simplesamlphp-module`, installed for real with Composer (latest stable phar) in the official `php:8.3-cli-alpine` and `php:8.4-cli-alpine` images, extensions ignored at install time:

| Project | PHP | Pest | PHPUnit | Also installed |
| --- | --- | --- | --- | --- |
| A | 8.3 | 4.7.8 | 12.5.33 | SimpleSAMLphp 2.5.4, test-framework 1.11.7, PHPStan 2.3.7, PHP_CodeSniffer 4.0.4 + `slevomat/coding-standard` 8.31.3, `phpat` 0.12.5, `carthage-software/mago` 1.61.0 |
| B | 8.4 | 5.3.7 | 13.4.7 | same, plus `pestphp/pest-plugin-phpstan` 5.3.1 |

Mago was run both as the release binary (`mago-1.61.0-x86_64-unknown-linux-musl`) on the host and through `vendor/bin/mago` inside the containers.

The sample:

- `src/`: a controller written the way SimpleSAMLphp module controllers are (`Configuration`, `Session`, `Utils\Auth`, `XHTML\Template`, Symfony `Request`), an entity with a `@phpstan-type` array shape, a generic `Collection` (`@template`, `@implements`, conditional return type, `@phpstan-assert-if-true`), and a repository interface. Formatted to pass the SimpleSAMLphp phpcs ruleset. Eight type defects and one layering breach (Domain using Symfony HttpFoundation) were seeded.
- `tests/`: one Pest file with `beforeEach` and `it` closures using `$this` (declared property, dynamic property, helper method on the bound `TestCase`), inline, named and bound datasets, three higher-order tests, a custom expectation, an `arch()` test and one seeded defect; plus `tests/Pest.php` and a base `TestCase`.

The sample is valid: Pest ran it on both projects (10 passed, 1 skipped, the `arch()` test failing on the seeded breach).

Everything under "Verified by running" below was executed. Everything else is quoted from Mago's documentation at tag 1.61.0, its repository, releases and issue tracker, Packagist metadata, or the SimpleSAMLphp repositories; see Sources.

## What Mago is

One static Rust binary with several commands sharing one `mago.toml` (docs, `tools/overview`):

- `analyze`: static analyzer.
- `lint`: 193 rules in 9 categories, plus `lint --semantics` as a `php -l` replacement.
- `format`: parse-and-reprint formatter, PER-CS by default, presets `psr-12`, `laravel`, `drupal`.
- `guard`: dependency ("perimeter") and structural rules.
- `twig:lint`, `twig:fmt`: Twig linter and formatter, separate from the PHP commands.
- `fix`: applies guard, analyzer, linter and formatter fixes until stable.

No language server command exists in the 1.61.0 binary.

## Analyzer versus PHPStan max

### Verified by running

**On `src/`, both tools found all eight seeded defects.** PHPStan max reported 8 errors, one per defect. Mago with default settings reported 13 issues (10 errors, 3 warnings) on the same eight locations: some defects produce two codes (for example `possibly-null-argument` and `invalid-argument` on one call), plus one `mixed-assignment` warning.

- Generics and conditional return types worked in both: `$all->first()` on a `Collection<Entity>` narrowed to `Entity` after a null check, and returning its `non-empty-string` id from an `int` method was reported by both.
- `@phpstan-type`, `@phpstan-param`, `@phpstan-return` and `@phpstan-assert-if-true` were read by Mago; its message for the array-shape mismatch prints the shape declared with `@phpstan-type`.
- SimpleSAMLphp and Symfony symbols resolved from `vendor/` with no extension in either tool: undefined method on `SimpleSAML\Session`, `mixed` out of `Configuration::getOptionalArray()`, `string|null` out of `$request->query->get()`. Neither tool has a SimpleSAMLphp extension; the test framework brings only `phpstan-phpunit` and `phpstan-mockery`.
- Mago has no numbered levels. Strictness is a set of flags under `[analyzer]`. With the documented "maximum strictness" set, the same `src/` gave 25 issues: the extra ones are unhandled exceptions (`check-throws`), a missing `#[Override]`, a non-final class, a missing `@api`/`@internal`, and the possibly missing key on `array<string, string>`, which PHPStan max does not report.
- Baseline: `mago analyze --generate-baseline --baseline <file>` wrote a TOML file (loose variant, grouped by file, code and message with a count); the next run with `--baseline` reported no issues.
- Suppressions are per tool. Mago ignored `// @phpstan-ignore argument.type`; PHPStan ignored `// @mago-expect analysis:possibly-null-argument`. Running both analyzers means suppressing twice.
- PHP 8.3 versus 8.4: analysis output of the whole sample (`src/` and `tests/`) was byte-identical with `php-version = "8.3"` on project A and `"8.4"` on project B (35 issues each). With `--php-version 8.3`, property hooks, asymmetric visibility and `new` without parentheses in a chain were rejected as `semantics` errors; with 8.4 they were accepted by both linter and analyzer.
- Speed, for what it is worth at this size: on a copy of SimpleSAMLphp 2.5.4 core `src/` (106 files, about 24,500 lines), `mago analyze` took 0.4 s wall on 12 logical CPUs and PHPStan max took 4.1 s including container start, both without a result cache. They reported a similar volume (about 1,020 findings each). The module will be far smaller than that, so speed does not decide anything here.

**On the Pest test file, Mago's analyzer produces false errors.** Results were identical with Pest 4 and Pest 5. Of 22 issues in `tests/`:

- 3 are true and PHPStan reports them too (`string` passed where `non-empty-string` is expected).
- `$this->collection = ...` and `$this->undeclared = ...` in `beforeEach` are `non-existent-property` **errors** on `Pest\PendingCalls\TestCall`. Mago takes Pest's `@param-closure-this TestCall` annotation literally.
- Every later use of `$this` in a test closure is a `non-documented-method` or `non-documented-property` **warning** ("Ambiguous ... on class `Pest\PendingCalls\TestCall`"), 10 in total. The seeded defect (`->noSuchMethod()` on an `ArrayObject`) is one of these warnings, indistinguishable from the false ones.
- `$this` in a bound dataset (`->with([fn() => $this->helper()])`) is an `undefined-variable` error, followed by a `mixed-method-access` error.
- The custom expectation and the higher-order property calls are 4 "ambiguous" warnings on `Pest\Expectation`; `$this->value` inside `expect()->extend()` is a `mixed-method-access` error.

No Pest analyzer extension for Mago was found on Packagist. The only test-framework extension found is a third-party PHPUnit one with negligible adoption.

**PHPStan on the same file depends on the Pest plugin**, which closes a point left unverified in `docs/research/pest-compat.md`:

- Project B (Pest 5, `pestphp/pest-plugin-phpstan` 5.3.1): 11 errors at max. `$this` resolves to the bound `TestCase`, datasets and higher-order tests are understood, and the seeded defect is reported precisely (`Cannot call method noSuchMethod() on ArrayObject<int, string>|null`). Remaining noise: the custom expectation is unknown, the dynamic property makes one assertion "always true", and `$this->value` inside `expect()->extend()` is typed `null`.
- Project A (Pest 4, no plugin): 35 errors, almost all false, the same `TestCall` confusion Mago shows. Every release of `pestphp/pest-plugin-phpstan` requires `pestphp/pest ^5.0` and PHP `^8.4`, so there is no first-party plugin for Pest 4.

### From documentation and the tracker, not run

- Mago's docs describe the analyzer as "compatible with Psalm and PHPStan annotations, with support for generics, conditional types, and flow narrowing".
- Built-in analyzer plugins are `stdlib` (default), `psl`, `flow-php` and `psr-container`. There is none for Symfony, Doctrine or PHPUnit.
- Since some 1.x release Mago has an extension mechanism: external worker processes speaking a binary protocol, with a PHP SDK shipped in the Composer package, able to add linter rules and analyzer plugins. PHPStan extensions cannot be reused. The FAQ still says analyzer plugins come "not before 1.0.0" as Rust compiled to WASM, so the documentation is not consistent with itself on this.
- **The 1.x analyzer is slated for replacement.** The "Mago 2.0" tracking issue (#1931, opened 2026-06-01, updated 2026-10-15) describes 2.0 as "a ground-up rework of the analysis pipeline" and lists "EOL `mago-analyzer`, superseded by inference + checker; it does not get a 2.0". The new type checker is still unchecked on that list. A project adopting the analyzer now should expect its findings and possibly its configuration to change at 2.0.
- PHPStan: `--level max` is an alias for the highest level, currently 10, which is strict about implicit `mixed`.
- Upstream practice is far below max: `simplesamlphp/simplesamlphp` 2.5 and `simplesamlphp-module-ldap` run PHPStan at level 3 on `src/` (the module with a baseline), and the test framework's own config uses level 6. "Max on `src/`" is this project's choice, not a SimpleSAMLphp convention.

### Assessment

The evidence supports "Mago's analyzer is a capable type checker on SimpleSAMLphp-style code", not "replace PHPStan":

- PHPStan comes with the test framework regardless, and the things this harness plugs into it (`phpat`, the Pest plugin, `phpstan-phpunit`) have no Mago equivalent.
- The sample is eight seeded defects. It says nothing about false-positive rates on a real codebase; the tracker has open false-positive reports, as any analyzer's does.
- The analyzer is the component with the least stable future (2.0).

Running it alongside PHPStan on `src/` is cheap in time but not free: a second set of suppressions and a second baseline format.

## Linter and formatter versus PHP_CodeSniffer with the SimpleSAMLphp ruleset

The standard official modules use is `PSR12` plus `vendor/simplesamlphp/simplesamlphp-test-framework/phpcs-simplesamlphp.xml`. Rule by rule, **verified by running** phpcs and Mago on the same files (a deliberately mis-styled file, and the sample):

| SimpleSAMLphp rule | Mago equivalent | Result |
| --- | --- | --- |
| `PSR12` layout (braces, indentation, spacing) | formatter, `preset = "psr-12"` | Reproduced; no PSR12 layout error after `mago format` |
| `Generic.Arrays.DisallowLongArraySyntax` | linter `array-style` | Reproduced, autofixed |
| `Generic.PHP.RequireStrictTypes` | linter `strict-types` | Reproduced, autofixed |
| `Generic.WhiteSpace.ArbitraryParenthesesSpacing` | formatter | Reproduced |
| `Slevomat...UnusedUses` | linter `no-redundant-use` | Reproduced, autofixed |
| `Slevomat...DisallowGroupUse` | formatter `expand-use-groups` | Reproduced |
| `Slevomat...AlphabeticallySortedUses`, `UseSpacing` | formatter `sort-uses`, `separate-use-types` | Reproduced |
| `Slevomat...TrailingArrayComma`, `RequireTrailingCommaIn*` | formatter `trailing-comma` | Reproduced on the sample |
| `Slevomat...ConstantSpacing`, `PropertySpacing` (one blank line) | formatter `empty-line-after-class-like-constant`, `empty-line-after-property` | Reproduced |
| `Slevomat...MethodSpacing` (**two** blank lines between methods) | none: `empty-line-after-method` is a boolean | **Not reproducible** |
| `Slevomat...ClassMemberSpacing` (**two** blank lines between member kinds) | none: `separate-class-like-members` is a boolean | **Not reproducible** |
| `Slevomat...FullyQualifiedClassNameInAnnotation` | none found | **Not reproducible** |
| `Slevomat...ClassConstantTypeHint` (typed constants) | none found among linter rules | **Not reproducible**; untyped constant not reported |
| `PSR12.Properties.ConstantVisibility` | none found | **Not reproducible**; `const X` without visibility not reported |
| `Generic.VersionControl.GitMergeConflict` | not checked | Unknown |

Autofixes were applied with `mago lint --fix --unsafe --potentially-unsafe`; which of the three need the unsafe flags was not separated.

Consequences:

- **Formatter.** `mago format` always collapses the two blank lines between methods into one. On the phpcs-clean sample it rewrote every class; phpcs then reported 18 spacing errors (`MethodSpacing`, `ClassMemberSpacing`) on the result. `phpcbf` would put the blank lines back and `mago format` would remove them again. The two can only coexist if those two sniffs are switched off, which is a visible departure from the style of official modules. The formatter has no extension API.
- With `preset = "default"` (PER-CS) the formatter also inlines empty constructor bodies (`) {}`), which PSR12 phpcs rejects; the `psr-12` preset avoids that.
- **Linter.** It cannot enforce the ruleset on its own (three rules missing, spacing aside). Its default rules also carry opinions that are not SimpleSAMLphp's: on the sample it reported `final-controller` as an **error** on the controller (with the `symfony` integration enabled; SimpleSAMLphp controllers are not final), `function-name` asking for snake_case on a test helper, and `literal-named-argument`. What it adds over phpcs is a different kind of rule (redundancy, safety, security, correctness), each configurable or switchable off.
- Formatter and linter operate on Pest files without breaking them: after `mago format` and `mago lint --fix` on the test directory, Pest gave the same results. The formatter does restyle chains (short `expect()->...->and()` chains are joined on one line; in higher-order tests each call goes on its own line, losing the `->getX()->toBe()` pairing). The linter has a `pest` integration with four rules (`no-only` and three expectation-simplification rules).

## Guard versus Pest architecture tests and `phpat`

**Verified by running:**

- A perimeter rule "Domain may only use PHP built-ins and itself" reported the seeded breach twice (the `use` and the parameter type). A probe class depending on `SimpleSAML\Configuration`, on the module's own controller, and on `\SimpleSAML\Session::class` was reported on every reference.
- `phpat` 0.12.5 through PHPStan, with the equivalent `canOnlyDependOn()` rule, reported the same four dependencies (once each; guard also reports the `use` lines). Pest's `arch()->expect(...)->not->toUse(...)` failed on the same breach.
- Guard is deny-by-default over everything in `[source].paths`. With `tests` among the paths and no rule for the test namespaces, it reported 56 extra errors, every `it()`, `expect()` and class reference in the test files. Tests need their own `permit = ["@all"]` rule (including one for `@global`, where Pest files live), or guard has to be run on `src` only.
- `permit = ["@self"]` on a rule for `SimpleSAML\Module\console\Domain\` did not let in the rest of `SimpleSAML\`, which matters because a module shares its root namespace with core. The docs word `@self` as "the same root namespace", so this deserves a second look before relying on it.

**From documentation:** layering order, layer aliases, allow/deny restrictions per dependency, and structural rules (`must-be-final`, `must-be-named`, `must-extend`, `must-implement`, `only-public-methods`, ...). Baseline and `@mago-expect guard:` suppressions are supported. Guard has no extension API. A structural rule was configured in the sample but not exercised with a violation.

**Assessment.** For namespace dependency rules guard is on a par with `phpat` and with Pest `arch()` on this sample. Differences that matter here:

- Pest `arch()` comes with Pest at no extra cost and lives next to the tests; if Pest is adopted there is no gap for guard to fill.
- `phpat` needs PHPStan and its rules are PHP classes; guard needs neither PHP nor PHPStan and its rules are TOML. In the fallback stack (PHPUnit, `phpat`, Infection) guard could replace `phpat`.
- Guard does nothing for mutation testing or the rest of the harness.

## Twig tools

Not in the ticket, but the Console UI is planned as server-rendered Twig. **Verified by running** on a copy of SimpleSAMLphp 2.5.4 core `templates/` (15 `.twig` files): `mago twig:lint` with default rules reported no issues; `mago twig:fmt --check` wanted to reformat 9 of them. So the Twig formatter does not match core's template style out of the box; the linter is unobtrusive. Not evaluated further.

## Maturity

- **Releases.** 1.0.0 on 2025-12-20; 1.61.0 on 2026-11-21. Forty releases between 2026-06-24 and 2026-11-21, patch releases often hours apart. Fast fixes, and also a fast-moving target.
- **Stability guarantees.** `mago.toml` takes a `version` pin (major, minor or exact); a major mismatch is fatal, minor drift warns. `mago init` writes a major pin. No written policy was found on whether a 1.x minor may add or change diagnostics or formatter output; given the cadence, an exact or minor pin is the only safe assumption for CI. The 2.0 tracking issue promises semver for the Rust API from 2.0, which is not the same thing.
- **Project.** Apache-2.0/MIT, repository created 2024-10-26, 112 open and 1,745 closed issues. One contributor has about 3,570 commits; the next has about 100. The Composer package has about 3.3 million downloads (about 710,000 a month) and 417 dependents on Packagist.
- **PHP versions.** The binary does not use the project's PHP. `php-version` selects the target (the source knows 7.0 to 8.6). The Composer wrapper requires `php ~8.1 || ... || ~8.6` and `revolt/event-loop ^1.0.9`, so it fits both an 8.3 and an 8.4 floor.
- **Installation.** Verified: `composer require --dev carthage-software/mago` resolved and installed next to SimpleSAMLphp 2.5.4, the test framework and Pest 4 (PHP 8.3) and Pest 5 (PHP 8.4). The package is a wrapper: the first `vendor/bin/mago` call downloaded an 11.9 MB musl binary from the GitHub release and cached it under `vendor/`, in both Alpine images. CI therefore needs network access to GitHub on first run; the docs recommend passing `GITHUB_TOKEN` to avoid anonymous rate limits. Also documented, not tried: shell installer with build-attestation verification, a 26 MB `ghcr.io/carthage-software/mago` image, Homebrew, Cargo, Nix.
- **CI.** Documented: a GitHub Actions recipe using the third-party `nhedger/setup-mago` action, and automatic `github` annotation output when `GITHUB_ACTIONS` is set. Verified from the binary: report formats `rich`, `medium`, `short`, `ariadne`, `github`, `gitlab`, `json`, `count`, `code-count`, `checkstyle`, `emacs`, `sarif`.
- **Editors.** No language server in 1.61.0; the FAQ plans it for 2.0 and says the project will not maintain editor extensions. The VS Code recipe is format-on-save through a generic "custom formatter" extension; there are recipes for Zed and Helix. A third-party Packagist package advertises a binary built with a `language-server` feature; not tried.

## Open questions

- If the maintainer wants a formatter at all: accept dropping `MethodSpacing` and `ClassMemberSpacing` from the inherited ruleset (and so diverge from official modules), or stay on `phpcbf`.
- Whether a second analyzer on `src/` is worth a second set of suppressions before any module code exists to measure false positives on. This cannot be answered from a seeded sample.
- If the PHP floor stays at 8.3 and Pest 4 is used, PHPStan cannot analyse Pest test files usefully (no first-party plugin for Pest 4) and neither can Mago. The map does not require it; it only matters if test code is ever put under static analysis.

## Not verified

- False-positive behaviour of Mago's analyzer on a real codebase of this module's shape.
- Mago's extension mechanism (writing an analyzer plugin or linter rule), `mago fix`, watch mode, strict baselines, guard structural rules firing.
- `mrpunyapal/peststan` as a PHPStan plugin for Pest 4.
- CI and editor integrations; only the report formats and the Composer wrapper were exercised.
- Mago's behaviour on `Generic.VersionControl.GitMergeConflict`-style input.
- Mago versions other than 1.61.0.

## Sources

- Mago documentation at tag 1.61.0 (`docs/content/en` in `github.com/carthage-software/mago`, published at `https://mago.carthage.software/latest/en/`): `tools/overview`, `tools/analyzer/*`, `tools/linter/*`, `tools/formatter/*`, `tools/guard/*`, `extensions/overview`, `fundamentals/baseline`, `fundamentals/suppressing-issues`, `guide/installation`, `guide/configuration`, `guide/upgrading`, `recipes/github-actions`, `recipes/vscode`, `faq`, `benchmarks`.
- Mago repository: releases list, `crates/formatter/src/settings.rs`, `crates/php-version`, `src/commands`; issue #1931 "Mago 2.0 - Tracking Issue".
- Packagist metadata for `carthage-software/mago` and `pestphp/pest-plugin-phpstan`; Packagist search for "mago".
- `simplesamlphp/simplesamlphp-test-framework` v1.11.7: `phpcs-simplesamlphp.xml`, `phpcs.xml`, `phpstan.neon`, `composer.json`.
- `simplesamlphp/simplesamlphp` branch `simplesamlphp-2.5`: `phpcs.xml`, `phpstan.neon`. `simplesamlphp/simplesamlphp-module-ldap` `master`: `phpcs.xml`, `phpstan.neon`, `phpstan-dev.neon`.
- PHPStan rule levels: `https://phpstan.org/user-guide/rule-levels`.
- Pest source as installed (`pestphp/pest` 4.7.8 and 5.x, `src/Functions.php`).
- `docs/research/pest-compat.md` on branch `research/pest-compat`.
