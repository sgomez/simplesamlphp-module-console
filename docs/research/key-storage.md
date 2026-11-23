# Private key and certificate storage in SimpleSAMLphp 2.5

Research for issue #5. Source: `simplesamlphp/simplesamlphp`, branch `simplesamlphp-2.5`, commit
[`6e34a73`](https://github.com/simplesamlphp/simplesamlphp/tree/6e34a73985f63aac5326e0c1f416bf3efc047c90)
(2026-11-10). All paths and line numbers refer to that commit.

## Answer

- Core **does** load certificates and private keys from a database: `pdo://<id>` locations, tuned by
  `cert.pdo.*` options in `config.php`. The recollection is confirmed.
- It is a bare lookup: core neither creates the tables, nor writes to them, nor encrypts or caches anything.
- Every lookup is a live query against the global `database.*` connection **during the SSO request**. That
  conflicts with the map's constraint that SSO requests never read the database (see
  [Consequences](#consequences-for-the-console)).
- Two location schemes exist: `file://` (default when there is no prefix) and `pdo://`. Nothing else.
- Inline material: certificates yes (`certData`, `keys`), private keys no.
- Rollover: `new_privatekey`, `new_certificate`, `new_privatekey_pass` beside the current ones.

## Location schemes

Single resolver: `Utils\Crypto::retrieveCertOrKey()`, `src/SimpleSAML/Utils/Crypto.php:402-465`, exposed as
`retrieveCertificate()` (`:479`) and `retrieveKey()` (`:496`).

| Location | Behaviour | Source |
| --- | --- | --- |
| `pdo://<id>` | Row lookup by id in the certificate or key table | `Crypto.php:404-443` |
| `file://<name>` | Prefix stripped, then treated as a file | `Crypto.php:444-449` |
| no prefix | Treated as a file | `Crypto.php:451-464`, `config/config.php.dist:90-91` |

File locations are resolved against `certdir` (default `cert/`) unless absolute
(`Crypto.php:452-455`, `src/SimpleSAML/Utils/Config.php:26-32`, `config/config.php.dist:83-93`).

Any other prefix (`data:`, `env:`, `https://`...) is not recognised and falls through to the file branch.

## Database storage (`pdo://`)

Documented only in `config/config.php.dist:95-123` and one changelog line ("Certificates and private keys can
now be retrieved from a database", `docs/simplesamlphp-changelog.md:694`, under version 2.0.0). The reference
docs under `docs/` and `modules/saml/docs/` do not mention `pdo://` or `cert.pdo.*`.

Options and defaults (`Crypto.php:410-414`, `config.php.dist:119-123`):

| Option | Default |
| --- | --- |
| `cert.pdo.table` | `certificates` |
| `cert.pdo.keytable` | `private_keys` |
| `cert.pdo.apply_prefix` | `true` (prepends `database.prefix`) |
| `cert.pdo.id_column` | `id` |
| `cert.pdo.data_column` | `data` |

Query (`Crypto.php:429-431`):

```sql
SELECT <data_column> FROM <table> WHERE <id_column> = :id
```

Facts from the code:

- **Schema.** Core ships no DDL. "They are not created or managed by simplesaml" (`config.php.dist:97-99`).
  The only contract is two tables, each with an id column and a column holding PEM text. Types, keys and any
  extra columns are up to whoever creates them. Table and column names are interpolated into the SQL
  unquoted, so they must be plain identifiers.
- **Connection.** `\SimpleSAML\Database::getInstance()` (`Crypto.php:417`), i.e. the global `database.dsn`
  connection. There is no separate DSN for keys. The query goes through `read()`, which uses a secondary
  when `database.secondaries` is set (`src/SimpleSAML/Database.php:187-191`, `:286`).
- **Encryption.** None. The column value is returned verbatim (`Crypto.php:437-441`) and must already be
  PEM. The only protection core understands is a passphrase-protected PEM, with the passphrase in
  `privatekey_pass` in the entity metadata in clear text (`Crypto.php:228`).
- **Caching.** None. Each call runs a query.
- **Failure.** A connection or query error is logged and returns `null` (`Crypto.php:416-435`); callers then
  throw, e.g. `Unable to load private key from location` (`Crypto.php:222-224`).
- **Writes.** No core code inserts, updates or deletes rows in these tables.

## Who goes through the resolver

All key loading in core and in the `saml` module ends in `retrieveKey()` / `retrieveCertificate()`, so
`pdo://` works wherever a location is accepted:

| Use | Source |
| --- | --- |
| `privatekey` (any prefix) | `Crypto::loadPrivateKey()`, `Crypto.php:204-232` |
| `certificate` (any prefix) | `Configuration::getPublicKeys()`, `src/SimpleSAML/Configuration.php:1442-1472` |
| Signing messages and assertions | `modules/saml/src/Message.php:47-89` |
| Decryption keys | `modules/saml/src/Message.php:305-336` |
| Hosted IdP metadata | `modules/saml/src/IdP/SAML2.php:852-891` |
| Hosted SP metadata | `modules/saml/src/Auth/Source/SP.php:249-277` |
| Metadata signing (`metadata.sign.*`) | `src/SimpleSAML/Metadata/Signer.php:244-260` |
| Admin sanity check | `modules/saml/src/Event/Listener/SamlSanityCheckListener.php:33-61` |

Exceptions, file only:

- `XML\Signer::loadCertificate()` reads a file directly (`src/SimpleSAML/XML/Signer.php:187-202`).
- Redis TLS options use `getCertPath()` (`src/SimpleSAML/Store/RedisStore.php:66-75`).

Unverified: `saml.SOAPClient.certificate` / `saml.SOAPClient.privatekey_pass` (`modules/saml/docs/sp.md:349`)
are consumed by the `simplesamlphp/saml2-legacy` library, which was not inspected.

With `pdo://` on a hosted IdP, one SSO response costs one key query plus one certificate query per signed
element (`Message.php:57-62`, called from `SAML2.php:1148` for the assertion and `:1476` for the response).

## Inline material

- **Certificates: accepted.** `Configuration::getPublicKeys()` checks, in order, `keys` (array of entries with
  `X509Certificate` base64 data, `Configuration.php:1414-1428`), `certData` (base64 string, `:1429-1441`),
  then `certificate` as a location (`:1442-1472`). All three honour the prefix, so `new_certData` and
  `new_keys` work too.
- **Private keys: not accepted.** `privatekey` is always read as a location (`Crypto.php:210-220`). There is
  no `privatekeyData` or equivalent.

## Key rollover

Documented in `modules/saml/docs/keyrollover.md:35-39` and `:91`. Same options with the `new_` prefix, in
`saml20-idp-hosted` metadata or in a `saml:SP` authsource: `new_privatekey`, `new_certificate`,
`new_privatekey_pass`. Each takes the same location forms as the unprefixed option.

Behaviour while both are present:

- Signing uses the current key only (`Message.php:59-62`).
- Decryption tries the new key, then the current one (`Message.php:308-334`).
- Metadata lists both certificates; the new one for signing and encryption, the current one for signing
  only (`SAML2.php:854-877`).

Finishing the rollover is a manual edit: move the `new_*` values into the unprefixed options and delete the
`new_*` ones (`keyrollover.md:91`).

Related per-peer override: `signature.privatekey`, `signature.privatekey_pass` and `signature.certificate` in
`saml20-sp-remote` replace the hosted IdP's key for that SP
(`docs/simplesamlphp-reference-sp-remote.md:215-225`, `Message.php:52-58`).

## Consequences for the Console

1. Core `pdo://` storage makes every signing or decrypting SSO request query the database, with no cache
   and no fallback. This contradicts "SSO requests read only the node-local Snapshot, never the database".
   Recommending `pdo://` as the key path means dropping or weakening that constraint.
2. A path that keeps the constraint: the Console stores key material in its own tables and Publication
   writes it into node-local files, referenced from the Snapshot as file locations (absolute paths are
   accepted). Core then never touches the database for keys. Certificates can skip files entirely through
   `certData` or `keys`.
3. Core gives no at-rest protection for `pdo://` keys. Anything beyond clear-text PEM (or passphrase PEM with
   the passphrase in metadata) is the Console's own design.
4. If `pdo://` is still offered, the Console owns the DDL for both tables, and they must live in the global
   `database.dsn` database.
5. Rollover maps cleanly onto a Key reference with a "current" and an optional "next" slot.
