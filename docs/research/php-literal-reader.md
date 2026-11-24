# Reading a PHP array literal without executing it

Research for issue #36. Facts only; the choice belongs to the maintainer.

## Sources

| Source | Version / commit |
| --- | --- |
| `simplesamlphp/simplesamlphp`, branch `simplesamlphp-2.5` | `6e34a73985f63aac5326e0c1f416bf3efc047c90` |
| SimpleSAMLphp release tarball | `simplesamlphp-2.5.4-full.tar.gz` (tag `v2.5.4`, `3c74e4c`) |
| `nikic/php-parser` | v5.9.0, `9e33da9553fe7786f0962b35f4e4ecf01be89def` (the commit in core's lock) |
| `symfony/var-exporter` | v7.4.22, `6c967db30708068f6eaedb6ed37973bd86de2241` (core's lock) |
| `gettext/php-scanner` | v2.0.1, `43f53b6e0d5f9ac5ea165d8202c18267d6bd5dfd` (core's lock) |
| `simplesamlphp/simplesamlphp-module-metarefresh` | v1.3.1, `6bfa2e85e94c074e724e81bd3fa48975c0150a68` |
| PHP manual | [`PhpToken`](https://www.php.net/manual/en/class.phptoken.php), [`token_get_all`](https://www.php.net/manual/en/function.token-get-all.php), [`var_export`](https://www.php.net/manual/en/function.var-export.php) |
| php-parser docs | [`Constant_expression_evaluation`](https://github.com/nikic/PHP-Parser/blob/v5.9.0/doc/component/Constant_expression_evaluation.markdown), [`Error_handling`](https://github.com/nikic/PHP-Parser/blob/v5.9.0/doc/component/Error_handling.markdown), [`Pretty_printing`](https://github.com/nikic/PHP-Parser/blob/v5.9.0/doc/component/Pretty_printing.markdown) |
| Packagist metadata | read 2026-11-24 |

Experiments ran in `php:8.4-cli-alpine` (PHP 8.4.28), no network, with php-parser and var-exporter at the commits above. The scripts were throwaway and are not kept. "Verified" below means "observed in those runs".

## 1. Is `nikic/php-parser` already there?

Yes, as a **production** dependency, transitively.

- Core requires `gettext/php-scanner: ^2.0` in `require` (`composer.json:67`).
- `gettext/php-scanner` v2.0.1 requires `nikic/php-parser: ^5` (`composer.lock:159-174`).
- The lock resolves `nikic/php-parser` to **v5.9.0** in `packages`, not `packages-dev` (`composer.lock:411`; `packages-dev` starts at line 4940).
- The 2.5.4 release tarball ships `vendor/nikic/php-parser/`, `vendor/gettext/php-scanner/` and `vendor/symfony/var-exporter/` (verified by listing the tarball).
- Core uses it only through `Gettext\Scanner\PhpScanner`, for the translation commands (`src/SimpleSAML/Utils/Translate.php:46-57`, `src/SimpleSAML/Command/UpdateTranslatableStringsCommand.php:140`). `PhpFunctionsScanner.php:18` builds the parser with `createForNewestSupportedVersion()`.
- Core `master` still requires `gettext/php-scanner: ^2.0`.

Nothing in core reads PHP configuration without executing it: flat-file metadata is loaded with `include` (`src/SimpleSAML/Metadata/MetaDataStorageHandlerFlatFile.php:109`).

### Cost of requiring it

- **Packages added:** none on a SimpleSAMLphp 2.5 install. The module would declare `nikic/php-parser: ^5` itself, because relying on a transitive dependency breaks silently if core drops `gettext/php-scanner`.
- **Constraint drift:** `gettext/php-scanner` v2.1.0 (2026-11-23) widened to `^4.18 || ^5`. Core's lock stays on 5; a module constraint of `^5` keeps it there.
- **Dev tooling:** every consumer found wants 5.x. In core's lock, `packages-dev` requires `^5.0`, `^5.3.0`, `^5.7.0` and `^5.9.0` (`phpunit/php-code-coverage` 12.5.8). Current Packagist: `phpunit/php-code-coverage` 14.5.2 `^5.9.0`, `infection/infection` 0.35.12 `^5.6.2`, `pestphp/pest-plugin-mutate` 5.0.2 `^5.8.0`. `phpstan/phpstan` 2.3.7 declares no php-parser requirement (it ships as a PHAR). No conflict found.
- **Size:** 1.8 MB, 271 PHP files, already on disk. PSR-4 only, no `files` autoload; reading one entry loaded 25 php-parser classes. The parser table class alone is 196 KB of source (`lib/PhpParser/Parser/Php8.php`).
- **Requirements:** `php >=7.4`, `ext-tokenizer`, `ext-json`.
- **Risk:** a future php-parser 6 would need both core's chain and the module to move together. No 6.x exists on Packagist today.

## 2. PHP text to array

Two throwaway readers were written and run against the same corpus, with `eval` (inside the container only) as the oracle for accepted inputs.

Input shapes handled by both:

- `$metadata['<entity id>'] = [...];` is a statement and parses as is.
- `'id' => [...],` is a fragment. With php-parser it is wrapped as `<?php return [` + text + `\n];` and the single item is taken; columns on line 1 are shifted back by the prefix length. With tokens it is just "expression, `=>`, expression, optional comma".
- The shape is chosen by the first significant token: `T_VARIABLE` means statement.

Accepted grammar in both: strings without interpolation (single, double, heredoc, nowdoc), ints, floats, `true`/`false`/`null`, nested arrays in `[]` or `array()`, unary minus on a number, `.` between strings, and class constants looked up in a fixed name-to-value map (no class is loaded).

### Option A: `nikic/php-parser` plus an allowlist walk

About 115 lines. `ParserFactory::createForHostVersion()->parse()` gives the AST; a recursive function accepts `Scalar\String_`, `Scalar\Int_`, `Scalar\Float_`, `Expr\Array_`, `Expr\UnaryMinus` over a number, `Expr\BinaryOp\Concat`, `Expr\ConstFetch` for `true`/`false`/`null`, `Expr\ClassConstFetch` from the map, and rejects every other node type by default.

- **Positions:** syntax errors are `PhpParser\Error` with `getStartLine()` (`lib/PhpParser/Error.php:37`) and `getStartColumn($code)` (`:104`, valid when `hasColumnInfo()`, `:95`). Rejected nodes carry `getStartLine()` and `getStartFilePos()` (`lib/PhpParser/NodeAbstract.php:36`, `:85`); the column is the offset from the previous newline. Both were present on every case run, with no lexer option set.
- **Several errors at once:** `ErrorHandler\Collecting` returned three errors with line and column for one broken input (verified).
- **Free from the library:** escape sequences, heredoc and nowdoc including closing-indentation removal (`ParserAbstract.php:806`), every numeric form, int overflow to float, comments, trailing commas, `array()` versus `[]`, case-insensitive and `\`-prefixed `true`/`false`/`null`.
- **Still hand-written:** duplicate keys (the AST keeps both items; PHP and `ConstExprEvaluator` silently keep the last), key type checks (`true`, `null` and `1.5` as keys are legal PHP that coerces), the shape check on the statement, the constant map.
- **Result:** all 21 accepted cases equal to PHP's own evaluation on the first run.

### Option B: `PhpToken::tokenize()` plus a hand-written recursive-descent reader

About 235 lines, no dependency beyond `ext-tokenizer`.

- **Positions:** each `PhpToken` has `line` (1-based) and `pos` (0-based byte offset); the column is derived the same way as above. Verified.
- **What the tokenizer does not do**, and the reader had to (all verified by dumping tokens):
  - String tokens are raw source. `'…'` needs `\\` and `\'` unescaped; `"…"` and heredoc need the full escape set (`\n \r \t \v \e \f \\ \$ \"`, octal, `\xHH`, `\u{…}`). php-parser's equivalent is `String_::parseEscapeSequences` (`lib/PhpParser/Node/Scalar/String_.php:101`).
  - Heredoc and nowdoc bodies arrive with their indentation and trailing newline; the closing-marker indentation must be stripped by hand. `\"` is not an escape in heredoc.
  - `T_LNUMBER` text is raw (`0x1F`, `017`, `0o17`, `0b101`, `1_000`) and needs converting. A decimal literal above `PHP_INT_MAX` arrives as `T_DNUMBER`.
  - Interpolation shows as a bare `"` token followed by `T_ENCAPSED_AND_WHITESPACE`/`T_VARIABLE`; rejecting the `"` is enough.
  - Names arrive as `T_STRING`, `T_NAME_QUALIFIED` or `T_NAME_FULLY_QUALIFIED`.
- **Result:** the first draft differed from PHP on 2 of 21 accepted cases: `\true` (a `T_NAME_FULLY_QUALIFIED`, rejected) and `0xFFFFFFFFFFFFFFFFFF` (a hex literal that overflows is a `T_DNUMBER`, which `(float)` reads as `0.0`). Both are fixable; they show where the effort goes. The other 19 matched, including CRLF input and indented nowdoc inside an array.

### Rejections (both readers, verified)

35 inputs, all rejected by both; 29 at the same line and column. The other six point at different places of the same construct: the php-parser reader at the start of the offending expression, the token reader at the first token it cannot take (`60 * 60`: 1:8 versus 1:11; interpolated heredoc: 1:8 versus 2:4). For an unclosed array on a three-line input, php-parser reported 4:2, which is inside the wrapper's own `];` and past the end of the pasted text; the token reader reported 3:1. Samples:

| Input | php-parser reader | token reader |
| --- | --- | --- |
| `file_get_contents(...)` on line 3 | `Expr_FuncCall is not allowed at 3:12` | `Constant file_get_contents is not allowed at 3:12` |
| `"hi $x"` | `Scalar_InterpolatedString is not allowed at 1:16` | `'"' is not allowed at 1:16` |
| `` `id` `` | `Expr_ShellExec is not allowed at 1:8` | `` '`' is not allowed at 1:8 `` |
| `60 * 60` | `Expr_BinaryOp_Mul is not allowed at 1:8` | `Unexpected * at 1:11` |
| `\Foo\Bar::baz()` | `Expr_StaticCall is not allowed at 1:8` | `Constant Foo\Bar::baz is not allowed at 1:8` |
| missing comma | `Syntax error, unexpected T_CONSTANT_ENCAPSED_STRING, expecting ',' or ']' or ')' at 3:3` | `Expected ',' or ']', found ''b'' at 3:3` |
| unterminated string | `Syntax error, unexpected T_ENCAPSED_AND_WHITESPACE at 2:10` | dumps the rest of the input as the offending token, `at 2:10` |
| duplicate key on line 4 | `Duplicate key 'a' at 4:3` | same |
| `['8' => 1, 8 => 2]` | `Duplicate key 8 at 1:19` | same |
| second statement `system('id');` | `Expected a single statement at 2:1` | `Unexpected system at 2:1` |

Also rejected by both: variables, `new`, closures, `match`, casts, ternary, spread, references, magic constants, unknown constants, static properties, `?>` inside or after the text, a second entry, `$config[...]`.

Observations:

- The php-parser reader names what the construct **is** (a function call); the token reader can only say which token was unexpected, unless more code is added.
- Columns are **byte** offsets in both. `['ñandú' => $x]` reports column 22 where the character column is 20.
- php-parser messages use token names (`T_CONSTANT_ENCAPSED_STRING`) and node type names (`Expr_FuncCall`); a user-facing message needs a translation table either way.
- Neither reader strips a leading `<?php`; pasting a whole file fails at 1:1 unless that is handled.

### `ConstExprEvaluator` is not the gate

`PhpParser\ConstExprEvaluator` (`lib/PhpParser/ConstExprEvaluator.php:106-149`) evaluates every PHP constant expression, which is wider than "literals". Verified: it accepts `60 * 60`, `true ? 1 : 2`, `[...[1, 2]]`, `"a" . 1`, `[1, 2][0]`, and resolves `['a' => 1, 'a' => 2]` to the last value without complaint. It does call a fallback for constants and class constants, which is the documented hook for a closed list. But `ConstExprEvaluationException` extends plain `\Exception` with no node or position (`lib/PhpParser/ConstExprEvaluationException.php:5`), so "reject with line and column" needs a walk of one's own anyway. The allowlist walk above replaces it in about 50 lines.

### Limits (verified)

- 20 000 levels of nesting: accepted by both without a stack error (119 ms and 36 ms).
- 248 KB of input (2 000 endpoint entries): 49 ms with php-parser, 10 ms with tokens.

### Constants

Core's shipped `metadata/*.php.dist` and `config/authsources.php.dist` contain no class constants. Core's docs mention only `SAML2\Constants::COMPARISON_*` (`docs/simplesamlphp-reference-idp-remote.md:32-35`, `modules/saml/docs/sp.md:35-38`). Core's own converter output (section 3) is literals only. A pasted file with `use` aliases (`C::BINDING_HTTP_POST`) cannot be resolved from a fragment: the alias is not in the paste.

## 3. Array to PHP text

How existing code emits it:

- Core's XML-to-PHP converter: `'$metadata[' . var_export($entityId, true) . '] = ' . VarExporter::export($entityMetadata) . ";\n"` (`modules/admin/src/Controller/Federation.php:479-480`; also `:340`, `:404`, `:565`). `symfony/var-exporter: ~7.4` is in core's `require` (`composer.json:100`).
- `metarefresh` flat-file output: `VarExporter::export($m['metadata'])` with `addslashes($entityID)` for the key (`src/MetaLoader.php:632`); its older dump path still uses `var_export` (`:514`). It requires `symfony/var-exporter: ~7.4` itself.

Four emitters were run on the same document (verified):

| Emitter | Output | Notes |
| --- | --- | --- |
| `var_export` | `array (`, 2-space indent, `'k' => ` then a line break before nested arrays, explicit `0 =>` on lists, `NULL` | Stable, but not the style of any SimpleSAMLphp file. Newlines stay raw inside single quotes. |
| `VarExporter::export` | `[`, 4-space indent, list keys omitted, `[]` for empty, lowercase `null`, trailing commas | Same text as core's converter. A string with `\n`, `\r` or `\0` becomes a concatenation: `'a'."\n"` then `.'b'` on the next line (`Internal/Exporter.php:256-268`). Ints and floats go through `var_export` (`:218`). |
| php-parser `PrettyPrinter\Standard` | everything on **one line** | `pExpr_Array` goes multi-line only when an item has comments (`lib/PhpParser/PrettyPrinter/Standard.php:615-623`, `:1197-1203`). Useless for diffing without a custom printer. |
| Hand-written, 20 lines | same shape as `VarExporter`, strings always single-quoted with raw newlines | Full control; one more thing to test. |

Round trip `reader(emitter(x)) === x`, both readers:

- Passes for all four emitters on the sample document, on strings with NUL, ESC, CRLF, bytes `\x7f\x80\xff`, `$x {$y}`, backslashes, both quotes, `<?php ?>` and a heredoc-like `EOT;`, on keys `'08'`, `'8'`, `'-3'`, `''`, `"a\nb"`, and on list-versus-map shapes. `VarExporter`'s concatenated strings are why the reader must accept `.` and double-quoted escapes.
- `PHP_INT_MIN` is emitted as `-9223372036854775807-1` by `var_export` and `VarExporter` and as `(-9223372036854775807-1)` by the pretty printer: an arithmetic expression, rejected by a literal-only reader. Every other number round-trips, including `-0.0`, `1e100` and `0.1 + 0.2`.
- `INF` and `NAN` are emitted as bare constants.

Stability for diffing:

- Key order is insertion order in all four; none sorts. Canonical order has to come from the document.
- Float text depends on `serialize_precision`: `0.1 + 0.2` prints `0.30000000000000004` at the default `-1` and `0.3` at `5`, for both `var_export` and `VarExporter` (verified). The hand-written emitter used `var_export` for floats and inherits this.
- `VarExporter::export` on an object emits executable code (`\Symfony\Component\VarExporter\Internal\Hydrator::hydrate(...)`), not a literal. Only arrays of scalars are safe input; a JSON-decoded document is that.

## 4. What the facts favour

- For reading, php-parser costs no new package and no version conflict, and takes about half the code with none of the string, heredoc and number decoding. The token reader's only advantage is not naming the dependency, and its first draft already diverged from PHP twice.
- For writing, `VarExporter::export` is what core and `metarefresh` already print, is already installed, and round-trips through a reader that accepts concatenation. The pretty printer is the weakest candidate.

## Not verified

- PHP 8.5 or the `--prefer-lowest` floor; only PHP 8.4.28 with php-parser 5.9.0 was run.
- A real `composer require nikic/php-parser:^5` in the module next to Pest 5, Infection and PHPStan. The no-conflict claim rests on reading constraints in core's lock and on Packagist.
- Which constants appear in real pasted metadata or authsources; only core's templates and docs were searched. `X::class` was not tried.
- Real-world input beyond the 56-case corpus; no fuzzing, no invalid UTF-8.
- Peak memory. The measurement taken was not reliable and is left out.
- Whether `VarExporter`'s output format is contractually stable across Symfony minors. Only 7.4.22 was run.
- The `PhpToken` property semantics were taken from observed output, not checked line by line against the manual.
