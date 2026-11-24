# Minimum database engine versions and their limits

Research for [#42](https://github.com/sgomez/simplesamlphp-module-console/issues/42). Checked on 2026-11-24.

"Verified" means read in the cited primary source. "Measured" means run on that day against the official Docker image (`postgres:15` = 15.20, `mariadb:10.11` = 10.11.19, `mysql:8.4` = 8.4.13, `php:8.4-cli-alpine` = SQLite 3.53.4). Anything else is marked **unverified**.

## Minimum versions

Rule: the oldest release series the upstream project still maintains.

| Engine | Minimum today | Maintained until | Next in line | Docker tag |
| --- | --- | --- | --- | --- |
| PostgreSQL | 15 | 2027-11-11 | 16 (until 2028-11-09) | `postgres:15` |
| MariaDB | 10.11 LTS | 2028-02-16 | 11.4 LTS (until 2029-05-29) | `mariadb:10.11` |
| MySQL | 8.4 LTS | 2032-04 (Premier until 2029-04), dates unverified | 9.7 LTS (GA 2026-04-21) | `mysql:8.4` |
| SQLite | 3.24.0 (needed by the SQL) | n/a | n/a | bundled in `php:8.4-*` |

- **PostgreSQL.** A major version is supported for 5 years. 14 had its final release on 2026-11-12; 15 is the oldest supported, final release 2027-11-11. [Versioning policy](https://www.postgresql.org/support/versioning/).
- **MariaDB.** 10.6 reached community end of life on 2026-07-06. 10.11 ends on 2028-02-16, 11.4 on 2029-05-29. Series up to 11.4 get 5 years; later LTS get 3 years of binaries, so 11.8 (2028-06-04) ends before 11.4. When 10.11 ends, the oldest maintained is 11.4. [Maintenance policy](https://mariadb.org/about/#maintenance-policy).
- **MySQL.** 8.0 moved to Sustaining Support on 2026-04-21 ([EOL notices](https://www.mysql.com/support/eol-notice.html)), so 8.4 is the oldest maintained. An LTS series gets 5 years of Premier plus 3 of Extended Support ([manual](https://dev.mysql.com/doc/refman/8.4/en/mysql-releases.html)); 8.4.0 is dated 2024-04-30 ([release notes](https://dev.mysql.com/doc/relnotes/mysql/8.4/en/news-8-4-0.html)), which gives April 2029 and April 2032. **Unverified**: the exact dates come from that arithmetic and from endoflife.date (2029-04-30, 2032-04-30); Oracle's Lifetime Support PDF could not be fetched (HTTP 403). 8.0 kept receiving community releases until the end of Extended Support, so 2032 is the date that matters for a "maintained" rule; **unverified** that 8.4 will do the same. 9.7.0 is dated 2026-04-21 ([release notes](https://dev.mysql.com/doc/relnotes/mysql/9.7/en/news-9-7-0.html)) and the manual names 9.7 as the next LTS.
- **Docker tags.** All three exist in the [official-images library](https://github.com/docker-library/official-images/tree/master/library), as do `postgres:16`, `mariadb:11.4` and `mysql:9.7`.

## SQL features on the minimum versions

The whole DDL of [#30](https://github.com/sgomez/simplesamlphp-module-console/issues/30) was run unchanged on the four engines, plus the Node upsert and a row violating `CHECK (id = 1)`. Everything was accepted and the `CHECK` was enforced everywhere (measured).

| Feature | Engine | Result | Source |
| --- | --- | --- | --- |
| `GENERATED ALWAYS AS IDENTITY` | PostgreSQL 15 | works; added in 10 | [CREATE TABLE](https://www.postgresql.org/docs/15/sql-createtable.html), [10 release notes](https://www.postgresql.org/docs/release/10.0/) |
| `COLLATE "C"` | PostgreSQL 15 | works; available on all platforms, sorts by byte value | [Collation support](https://www.postgresql.org/docs/15/collation.html) |
| `INSERT … ON CONFLICT (…) DO UPDATE` with `excluded` | PostgreSQL 15 | works | [INSERT](https://www.postgresql.org/docs/15/sql-insert.html) |
| same | SQLite | needs 3.24.0 (2018-06-04) | [UPSERT](https://www.sqlite.org/lang_upsert.html) |
| `ON DUPLICATE KEY UPDATE … = VALUES(col)` | MariaDB 10.11, MySQL 8.4 | works on both; MySQL raises deprecation warning 1287 | [MariaDB](https://mariadb.com/docs/server/reference/sql-statements/data-manipulation/inserting-loading-data/insert-on-duplicate-key-update), [MySQL](https://dev.mysql.com/doc/refman/8.4/en/insert-on-duplicate.html) |
| `CHECK` in a column definition | MySQL 8.4 | enforced; implemented in 8.0.16 | [CHECK constraints](https://dev.mysql.com/doc/refman/8.4/en/create-table-check-constraints.html), [8.0.16 release notes](https://dev.mysql.com/doc/relnotes/mysql/8.0/en/news-8-0-16.html) |
| same | MariaDB 10.11 | enforced (error 4025). **Unverified**: "since 10.2.1" is not on the fetched page | [CONSTRAINT](https://mariadb.com/docs/server/reference/sql-statements/data-definition/constraint) |
| same | PostgreSQL 15, SQLite | enforced | [SQLite CREATE TABLE](https://www.sqlite.org/lang_createtable.html) |
| `VARBINARY(1024)` in a primary key | MariaDB 10.11, MySQL 8.4 | works; index key limit is 3072 bytes with the default `DYNAMIC` row format and 16 KB page, the widest key here is 32 + 1024 bytes | [MySQL InnoDB limits](https://dev.mysql.com/doc/refman/8.4/en/innodb-limits.html), [MariaDB InnoDB limitations](https://mariadb.com/docs/server/server-usage/storage-engines/innodb/innodb-limitations) |
| `TEXT COLLATE "C"` up to 1024 bytes in a primary key | PostgreSQL 15 | works (measured). **Unverified**: the B-tree entry limit (about 2700 bytes) is not in the limits appendix | — |
| `REPEATABLE READ` | PostgreSQL 15 | default is `READ COMMITTED`; must be set per transaction | [Transaction isolation](https://www.postgresql.org/docs/15/transaction-iso.html) |
| same | MariaDB 10.11, MySQL 8.4 | default level | [MySQL](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html), [MariaDB system variables](https://mariadb.com/docs/server/server-management/variables-and-modes/server-system-variables) |
| same | SQLite | not selectable; every transaction is serializable, one writer at a time | [Isolation](https://www.sqlite.org/isolation.html) |

### Things the decided design must account for

1. **PostgreSQL does not return zero rows for the losing Publication.** At `REPEATABLE READ`, an `UPDATE` whose target row was changed by a transaction that committed after the snapshot was taken aborts with `could not serialize access due to concurrent update`, SQLSTATE `40001`, and the transaction is rolled back ([manual, 13.2.2](https://www.postgresql.org/docs/15/transaction-iso.html)). Measured with the pointer `UPDATE … WHERE last_number = 0`: `40001` at `REPEATABLE READ`, `UPDATE 0` at `READ COMMITTED`. "Another Publication won" is therefore zero rows **or** `40001` on PostgreSQL. The same holds for any `UPDATE … WHERE version = ?` run inside that transaction.
2. **MariaDB 11.6.2 and later behave like PostgreSQL.** `innodb_snapshot_isolation` defaults to `ON` from 11.6.2 and makes the same `UPDATE` fail with error 1020 (`ER_CHECKREAD`, SQLSTATE `HY000`), rolling the transaction back ([InnoDB system variables](https://mariadb.com/docs/server/server-usage/storage-engines/innodb/innodb-system-variables)). On 10.11 it exists since 10.11.8 and is `OFF`: zero rows (measured both ways). MySQL 8.4 returns zero rows (measured). CI on the minimum version will not see error 1020; 11.8 and 12.3 will.
3. **Set the level with `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ`, not through a variable.** MariaDB 10.11 only has `tx_isolation` (`transaction_isolation` arrived in 11.1.1); MySQL 8.4 only has `transaction_isolation` (measured: each rejects the other name).
4. **`VALUES(col)` is the only upsert form common to both.** MySQL deprecates it in favour of a row alias (`… AS new ON DUPLICATE KEY UPDATE c = new.c`), which MariaDB 10.11 rejects as a syntax error (measured). Keep `VALUES()` and accept the MySQL warning, or branch per engine.
5. **SQLite needs a runtime check.** PHP 8.4 builds against any SQLite ≥ 3.7.7 ([`build/php.m4`](https://github.com/php/php-src/blob/PHP-8.4/build/php.m4), `PHP_SETUP_SQLITE`), below the 3.24.0 the upsert needs. Nothing else in the DDL needs a newer one; `ON CONFLICT` with an explicit conflict target is the 3.24.0 form, not the 3.35.0 generalisation.
6. **MySQL 8.4 disables `mysql_native_password`.** The default account plugin is `caching_sha2_password` ([8.4.0 release notes](https://dev.mysql.com/doc/relnotes/mysql/8.4/en/news-8-4-0.html)); it matters for the CI connection and for the installation notes, not for the SQL.

## Snapshot size limits

A Snapshot is one row, so its document travels in one packet in each direction.

| Engine | Limit | Default | Maximum |
| --- | --- | --- | --- |
| MariaDB 10.11 | `max_allowed_packet` | 16 MiB (16777216) | 1 GiB |
| MySQL 8.4 | `max_allowed_packet` | 64 MiB (67108864) | 1 GiB |
| PostgreSQL 15 | field size | — | 1 GB |
| SQLite | `SQLITE_MAX_LENGTH` (compile time) | 1,000,000,000 bytes | 2^31 − 3 |

Sources: [MariaDB system variables](https://mariadb.com/docs/server/server-management/variables-and-modes/server-system-variables), [MySQL system variables](https://dev.mysql.com/doc/refman/8.4/en/server-system-variables.html), [MySQL "Packet too large"](https://dev.mysql.com/doc/refman/8.4/en/packet-too-large.html), [PostgreSQL limits](https://www.postgresql.org/docs/15/limits.html), [SQLite limits](https://www.sqlite.org/limits.html). The two defaults were also read from the running servers.

- **What counts as the packet.** "A single SQL statement sent to the MySQL server, a single row that is sent to the client" (MySQL manual). The limit applies to the whole `INSERT`, not to the document alone, and again to the row a node reads back: the server never sends more than the global value.
- **Measured.** MariaDB 10.11 stored a 16 MiB − 200 byte document and rejected a 16 MiB one; MySQL 8.4 stored 64 MiB − 200 bytes and rejected 64 MiB. Both fail with `ERROR 1153 (08S01): Got a packet bigger than 'max_allowed_packet' bytes` and the connection is closed. With the variable raised to 1 GiB both stored 200 MiB on otherwise default settings, as did PostgreSQL 15 and SQLite.
- **Practical size.** A little under 16 MiB on a default MariaDB 10.11 and under 64 MiB on a default MySQL 8.4. With PDO's emulated prepares (the `pdo_mysql` default) the document is escaped inside the statement text, and every `"`, `\` and newline of the JSON costs one more byte, so the usable size is lower by the share of such characters. **Unverified**: that share for a real Snapshot, and whether native prepares send the parameter unescaped in one packet under the same limit.
- **Raising it.** `max_allowed_packet` is a server setting (global dynamic; the session value is read-only), up to 1 GiB. **Unverified**: that `mysqlnd` imposes no lower client-side limit.
- **`LONGTEXT` itself** holds 4 GiB − 1 bytes, so the column never is the limit ([MariaDB LONGTEXT](https://mariadb.com/docs/server/reference/data-types/string-data-types/longtext), [MySQL InnoDB limits](https://dev.mysql.com/doc/refman/8.4/en/innodb-limits.html)).
- **PostgreSQL and SQLite** have no equivalent tunable; the limits above are far past any Snapshot. PHP's `memory_limit` is reached first on every engine (**unverified**, not measured).
