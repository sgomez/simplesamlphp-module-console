# Option reference for the initial authsource types

Research for issue #7. Baseline: SimpleSAMLphp 2.5.

## Sources

Every option below was read from the code that consumes it, not only from the docs.

| Short name | Repository | Ref | Commit |
| --- | --- | --- | --- |
| core | `simplesamlphp/simplesamlphp` | branch `simplesamlphp-2.5` | `6e34a73985f63aac5326e0c1f416bf3efc047c90` |
| ldap | `simplesamlphp/simplesamlphp-module-ldap` | tag `v2.5.2` | `d17c699bda6c55390be80aee7c9ea10f97bb3d1b` |
| sqlauth | `simplesamlphp/simplesamlphp-module-sqlauth` | tag `v1.4.1` | `ae5a944d4e2e7f8478cff43a3feef902492b3175` |
| authcrypt | `simplesamlphp/simplesamlphp-module-authcrypt` | tag `v1.3.0` | `462579ff29957c8465fbad8fe09f5110438d0096` |
| saml2-legacy | `simplesamlphp/saml2-legacy` | tag `v4.21.1` | (tag) |

File paths in this document are relative to those repositories at those refs.

Version compatibility, from each `composer.json`:

- core 2.5 requires `php: ^8.3` and `simplesamlphp/saml2-legacy: ~4.20`.
- ldap `v2.5.x` requires `simplesamlphp/simplesamlphp: ^2.5@dev`, `php: ^8.3`, `symfony/ldap: ^7.4`. The previous line, `v2.4.10`, requires `^2.3` and `symfony/ldap: ^6.4`.
- sqlauth `v1.4.x` requires `simplesamlphp/simplesamlphp: ^2.5@dev`, `php: ^8.3`. The previous line, `v1.3.1`, requires `^2.2`.
- authcrypt `v1.3.0` requires `^2.5@dev`, `php: ^8.3`.

## Which types exist

Authsource classes shipped inside core 2.5 (`modules/*/src/Auth/Source/`):

| Type string | Notes |
| --- | --- |
| `saml:SP` | |
| `core:AdminPassword` | |
| `core:SourceIPSelector` | Delegates to another authsource by client IP |
| `core:RequestedAuthnContextSelector` | Delegates by requested AuthnContext |
| `multiauth:MultiAuth` | Lets the user choose among other authsources |
| `exampleauth:UserPass` | Users and passwords inline |
| `exampleauth:StaticSource` | Fixed attribute set, no login |
| `exampleauth:UserClick` | Persona chooser, no password |
| `exampleauth:External` | Code sample, not configurable |

Shipped as separate packages compatible with 2.5:

| Type string | Package | Notes |
| --- | --- | --- |
| `ldap:Ldap` | ldap `v2.5.2` | |
| `ldap:LdapMulti` | ldap `v2.5.2` | Organisation chooser over several `ldap:Ldap` sources |
| `sqlauth:SQL2` | sqlauth `v1.4.1` | Current format |
| `sqlauth:SQL`, `sqlauth:SQL1Compat` | sqlauth `v1.4.1` | Deprecated wrappers over `SQL2` |
| `sqlauth:PasswordVerify`, `sqlauth:PasswordVerify1Compat` | sqlauth `v1.4.1` | Deprecated wrappers over `SQL2` |
| `authcrypt:Hash`, `authcrypt:Htpasswd` | authcrypt `v1.3.0` | |

Three corrections to the names used in the ticket and the brief:

- **`userpass:Database` does not exist.** There is no `userpass` module in core 2.5 (`modules/` holds `admin`, `core`, `cron`, `debugsp`, `exampleauth`, `multiauth`, `saml`), no `simplesamlphp-module-userpass` repository in the `simplesamlphp` organisation (HTTP 404), and a code search for `"userpass:Database"` across the organisation returns zero hits. A database-backed username/password source is exactly what `sqlauth` provides.
- **The LDAP type string is `ldap:Ldap`, not `ldap:LDAP`.** `src/ConnectorFactory.php` line 37 asserts the configured type is literally `'ldap:Ldap'`, so any other casing fails even on a case-insensitive filesystem.
- **`sqlauth:SQL` is deprecated in the 2.5-compatible release.** In `v1.4.1` it is an empty subclass of `SQL1Compat`, which logs a deprecation warning on every construction and rewrites the configuration into the `sqlauth:SQL2` format (`src/Auth/Source/SQL.php`, `src/Auth/Source/SQL1Compat.php`). New work should target `sqlauth:SQL2`.

## Recommendation for the fourth and fifth types

1. **`multiauth:MultiAuth`** (fourth). In core, two options, no secrets, and it is the only way to offer several managed authsources behind one IdP. Its values are references to other authsource ids, which the Console can validate at Publication.
2. **`exampleauth:UserPass`** (fifth). In core, needs no external service, so it is the cheapest target for the local environment and for browser tests. It carries a caveat: passwords live in array keys (see below), so its schema cannot be a plain mirror of the PHP array. It is a test source and should be labelled as such in the UI.

Considered and not recommended first:

- `core:AdminPassword`: it has no options of its own (the password is `auth.adminpassword` in `config.php`, which is out of scope). A form adds nothing, and it is normally the source that protects the Console itself, so it should stay in the hand-written file.
- `core:SourceIPSelector`, `core:RequestedAuthnContextSelector`: useful selectors with small option sets and no secrets; good candidates right after `multiauth`, same reference-validation logic.
- `ldap:LdapMulti`: natural companion of `ldap:Ldap`, small option set.
- `authcrypt:Hash`: same key-embedded credential problem as `exampleauth:UserPass`, with hashes instead of clear text, and needs an extra package. `authcrypt:Htpasswd` only points at a file on the node.
- `exampleauth:StaticSource`: the whole configuration array is the attribute set, so there are no named options to describe.

## Options common to every type

| Name | Type | Default | Required | Secret | Notes |
| --- | --- | --- | --- | --- | --- |
| `0` (positional) | string | none | yes | no | The type string, `module:Class`. `Auth\Source::validateSource()` requires key `0` to be a string; `parseAuthSource()` removes it before calling the constructor (`src/SimpleSAML/Auth/Source.php`). |

Options common to every source that extends `core` `UserPassBase` (`ldap:Ldap`, `sqlauth:*`, `exampleauth:UserPass`, `core:AdminPassword`, `authcrypt:*`), read in `modules/core/src/Auth/UserPassBase.php`:

| Name | Type | Default | Required | Secret | Notes |
| --- | --- | --- | --- | --- | --- |
| `core:loginpage_links` | list of `{href, text}` | none | no | no | Rendered by `modules/core/templates/loginuserpass.twig`; `text` goes through the translator. |
| `remember.username.enabled` | boolean | `false` | no | no | Cast with `(bool)`. |
| `remember.username.checked` | boolean | `false` | no | no | Cast with `(bool)`. |

`UserPassOrgBase` (parent of `ldap:LdapMulti`) reads `remember.username.enabled`, `remember.username.checked`, `remember.organization.enabled` and `remember.organization.checked`, all boolean, default `false`.

Authsources are looked up through `Configuration::getConfig('authsources.php')` both by core (`Auth\Source::getById()`) and, independently, by the ldap module (`ConnectorFactory::fromAuthSource()`). A managed authsource is therefore only usable if it is visible through that file.

## `saml:SP`

Read in `modules/saml/src/Auth/Source/SP.php`, `modules/saml/src/Message.php`, `modules/saml/src/Controller/ServiceProvider.php`, `src/SimpleSAML/Utils/Crypto.php`, `src/SimpleSAML/Configuration.php` (`getPublicKeys`), `src/SimpleSAML/Auth/ProcessingChain.php` and saml2-legacy `src/SAML2/SOAPClient.php`. The whole authsource array is wrapped in a `Configuration` object and passed around as "SP metadata", so options are read in many places.

"Localized" means a string or a map of language code to string (`getOptionalLocalizedString`).

### Identity and IdP selection

| Name | Type | Default | Required | Secret | Notes |
| --- | --- | --- | --- | --- | --- |
| `entityID` | string (URI) | none | yes | no | Max length per SAML2int constant; the literal `https://myapp.example.org/` is rejected. An invalid URI only logs a warning. |
| `idp` | string | `null` | no | no | Entity id of the single IdP. Unset means discovery. |
| `discoURL` | string | `null` | no | no | Falls back to global `idpdisco.url.saml20`. |
| `RelayState` | string | `'/'` | no | no | Redirect target after IdP-initiated SSO. |
| `enable_unsolicited` | boolean | `true` | no | no | |
| `RequestInitiation` | boolean | `false` | no | no | |
| `proxymode.passAuthnContextClassRef` | boolean | `false` | no | no | Read in the constructor; not in `docs/sp.md`. |

### AuthnRequest

| Name | Type | Default | Required | Secret | Notes |
| --- | --- | --- | --- | --- | --- |
| `ForceAuthn` | boolean | `false` | no | no | |
| `IsPassive` | boolean | `false` | no | no | |
| `ProtocolBinding` | string enum | HTTP-POST | no | no | One of HTTP-POST, HoK SSO, HTTP-Artifact (`getOptionalValueValidate`). |
| `AssertionConsumerServiceIndex` | integer | `null` | no | no | |
| `AttributeConsumingServiceIndex` | integer | `null` | no | no | Read in `Message::buildAuthnRequest`; not in `docs/sp.md`. |
| `AuthnContextClassRef` | string or list of strings | none | no | no | `getArrayizeString`. |
| `AuthnContextComparison` | string enum | `exact` | no | no | `exact`, `minimum`, `maximum`, `better`. Only used with `AuthnContextClassRef`. |
| `NameIDPolicy` | object `{Format, AllowCreate, SPNameQualifier}` | transient, `true` | no | no | `[]` omits the element. Keys other than `Format` and `AllowCreate` come from the docs and the saml2 library, not verified here. |
| `IDPList` | list of strings | `[]` | no | no | |
| `ProxyCount` | integer | none | no | no | Not in `docs/sp.md`. |
| `disable_scoping` | boolean | `false` | no | no | |
| `ProviderName` | string | `null` | no | no | |
| `saml:Extensions` | list of XML chunk objects | `null` | no | no | **Not JSON-representable**, see below. Not listed as a config option in `docs/sp.md` (documented only as a login parameter). |
| `saml:logout:Extensions` | list of XML chunk objects | `null` | no | no | Same. |

### Signing, validation and encryption

| Name | Type | Default | Required | Secret | Notes |
| --- | --- | --- | --- | --- | --- |
| `sign.authnrequest` | boolean | `null` | no | no | IdP-remote value wins. |
| `sign.logout` | boolean | `null` | no | no | IdP-remote value wins. |
| `redirect.sign` | boolean | `false` | no | no | Fallback for both of the above. |
| `validate.logout` | boolean | `null` | no | no | |
| `redirect.validate` | boolean | `false` | no | no | |
| `signature.algorithm` | string (URI) | RSA-SHA256 | no | no | |
| `assertion.encryption` | boolean | `false` | no | no | |
| `nameid.encryption` | boolean | `false` | no | no | |
| `encryption.blacklisted-algorithms` | list of strings | `[RSA_1_5]` | no | no | |
| `saml20.hok.assertion` | boolean | `false` | no | no | |
| `WantAssertionsSigned` | boolean | unset | no | no | Only observed feeding the generated metadata in `SP.php`. Enforcement on incoming responses not traced: unverified. |

### Keys and certificates

| Name | Type | Default | Required | Secret | Notes |
| --- | --- | --- | --- | --- | --- |
| `privatekey` | string (location) | `null` | no | no (a reference) | A file name under the cert directory, `file://...`, or `pdo://<id>`. Inline PEM is not accepted (`Crypto::retrieveCertOrKey`). |
| `privatekey_pass` | string | `null` | no | **yes** | |
| `certificate` | string (location) | none | no | no | Same location forms as `privatekey`. |
| `certData` | string (base64) | none | no | no | Takes precedence over `certificate`. Public material. |
| `keys` | list of key objects | none | no | no | Takes precedence over `certData`. Each item: `type`, `signing`, `encryption`, `X509Certificate`, optional `name`. Not in `docs/sp.md`. |
| `key_name` | string | `null` | no | no | |
| `new_privatekey` | string (location) | `null` | no | no (a reference) | Key rollover, see `modules/saml/docs/keyrollover.md`. |
| `new_privatekey_pass` | string | `null` | no | **yes** | |
| `new_certificate`, `new_certData`, `new_keys`, `new_key_name` | as above | none | no | no | The `new_` prefix is applied to every key option. |
| `saml.SOAPClient.certificate` | string or `false` | unset | no | no (a reference) | File holding certificate and private key. `false` disables the client certificate. Unset falls back to `privatekey`/`certificate`. |
| `saml.SOAPClient.privatekey_pass` | string | none | no | **yes** | |
| `saml.SOAPClient.stream_context.ssl.peer_name` | string | none | no | no | Not in `docs/sp.md`. |
| `saml.SOAPClient.proxyhost` | string | none | no | no | Not in `docs/sp.md`. Passed untyped (`getValue`) to PHP `SoapClient` as `proxy_host`. |
| `saml.SOAPClient.proxyport` | integer | none | no | no | Not in `docs/sp.md`. Passed untyped to `SoapClient` as `proxy_port`. |

`pdo://` locations are resolved on each use against the global `database.*` connection, tables `certificates` and `private_keys` (names configurable with `cert.pdo.*` in `config.php`). See "Conflicts with the map" below.

### Generated metadata

| Name | Type | Default | Required | Secret | Notes |
| --- | --- | --- | --- | --- | --- |
| `AssertionConsumerService` | list of endpoint objects or strings | generated | no | no | Taken at face value. |
| `acs.Bindings` | list of strings | POST, Artifact (plus HoK if `ProtocolBinding` is HoK) | no | no | Unknown values are ignored with a warning. |
| `SingleLogoutServiceBinding` | list of strings | Redirect, SOAP | no | no | SOAP is dropped unless the session store is an SQL store. |
| `SingleLogoutServiceLocation` | string (URL) | generated | no | no | |
| `name` | localized | `null` | no | no | Only emitted when `attributes` is non-empty. |
| `description` | map of language to string | unset | no | no | Read with `getArray`, so a plain string is rejected. |
| `attributes` | list or map of strings | `[]` | no | no | Mixed list/map: a string key is the friendly name. |
| `attributes.required` | list of strings | unset | no | no | |
| `attributes.NameFormat` | string | unset | no | no | |
| `attributes.index` | integer | unset | no | no | |
| `attributes.isDefault` | boolean | unset | no | no | |
| `OrganizationName` | localized | `null` | no | no | The other two are only read when this one is set. |
| `OrganizationDisplayName` | localized | value of `OrganizationName` | no | no | |
| `OrganizationURL` | localized | none | when `OrganizationName` is set | no | The code throws if `OrganizationName` is set without it. |
| `contacts` | list of contact objects | `[]` | no | no | Contains personal data (names, emails, phones). |
| `EntityAttributes` | map of attribute name to list | unset | no | no | |
| `UIInfo` | object | unset | no | no | |
| `RegistrationInfo` | object | unset | no | no | |
| `NameIDFormat` | list of strings | unset | no | no | In `docs/sp.md`, but `SP.php` does not read it: the generated metadata derives `NameIDFormat` from `NameIDPolicy.Format`. Treat as docs-only. |

### Processing

| Name | Type | Default | Required | Secret | Notes |
| --- | --- | --- | --- | --- | --- |
| `authproc` | map of integer priority to filter config | unset | no | depends on filter | Passed as SP metadata to `Auth\ProcessingChain` (mode `sp`). Each filter is a string (`module:Class`) or an array with `class` plus filter-specific options. |

## `ldap:Ldap` (ldap `v2.5.2`)

Read in `src/Auth/Source/Ldap.php`, `src/ConnectorFactory.php` and `src/Connector/Ldap.php`.

| Name | Type | Default | Required | Secret | Notes |
| --- | --- | --- | --- | --- | --- |
| `connection_string` | string | none | yes | no | One or more space-separated URIs, each matching `^ldaps?://`. |
| `encryption` | string enum | `'ssl'` | no | no | `none`, `ssl`, `tls`. |
| `version` | integer | `3` | no | no | Positive. |
| `extension` | string | `'ext_ldap'` | no | no | Symfony adapter name. Not in the docs example. |
| `debug` | boolean | `false` | no | no | |
| `options` | object | `{network_timeout: 3, referrals: false}` | no | no | Symfony LDAP adapter options. Supplying it replaces the default wholesale. |
| `connector` | string (class name) | `SimpleSAML\Module\ldap\Connector\Ldap` | no | no | Must exist and implement `ConnectorInterface`. Shipped alternative: `...\Connector\ActiveDirectory`. |
| `timeout` | integer | `3` | no | no | Natural number. Search timeout. |
| `attributes` | list of strings, or `null` | absent | no | no | **Absent and `null` differ**: key present with `null` yields `['*']`, key absent yields `[]`. The code comment calls the absent case "return nothing (safe default)". |
| `attributes.binary` | list of strings | `[]` | no | no | Base64-encoded after retrieval. |
| `search.enable` | boolean | `false` | no | no | |
| `dnpattern` | string | none | when `search.enable` is `false` | no | `%username%` placeholder. |
| `search.base` | list of strings | none | **yes, always** | no | `getArray` runs before the `search.enable` branch, so it is required even with `dnpattern`. |
| `search.attributes` | list of strings | none | when `search.enable` is `true` | no | |
| `search.filter` | string | `null` | no | no | ANDed with the generated filter. |
| `search.scope` | string enum | `'sub'` | no | no | `base`, `one`, `sub`. |
| `search.username` | string | `null` | no | no | Bind DN for the search. `null` means anonymous. Whitespace-only is rejected. |
| `search.password` | string | `null` | no | **yes** | |
| `priv.username` | string | `null` | no | no | Bind DN used to read attributes after login. |
| `priv.password` | string | `null` | no | **yes** | |

Plus the `UserPassBase` options above.

### `ldap:LdapMulti`

| Name | Type | Default | Required | Secret | Notes |
| --- | --- | --- | --- | --- | --- |
| `username_organization_method` | string enum | none | yes | no | `none`, `allow`, `force`. |
| `include_organization_in_username` | boolean | `false` | no | no | |
| `mapping` | map of organisation to `{authsource, description?}` | none | yes, non-empty | no | `authsource` must name an `ldap:Ldap` source in `authsources.php`. `description` format (string or localized) not traced: unverified. |

## `sqlauth:SQL2` (sqlauth `v1.4.1`)

Read in `src/Auth/Source/SQL2.php`. The constructor validates types strictly and throws on any mismatch.

| Name | Type | Default | Required | Secret | Notes |
| --- | --- | --- | --- | --- | --- |
| `databases` | map of name to database object | none | yes, non-empty | | |
| `databases.<name>.dsn` | string | none | yes | **possibly** | PDO DSN. May embed `user=` and `password=`; the module masks them in error messages for that reason. Treat as sensitive. |
| `databases.<name>.username` | string | none | yes | no | Must be a string, `null` is rejected. |
| `databases.<name>.password` | string | none | yes | **yes** | Must be a string, `null` is rejected. |
| `databases.<name>.options` | map | `[]` | no | no | Passed as the PDO driver options array. Keys are PDO integer constants. |
| `auth_queries` | map of name to query object | none | yes, non-empty | | Tried in order. |
| `auth_queries.<name>.database` | string | none | yes | no | Must be a key of `databases`. |
| `auth_queries.<name>.query` | string (SQL) | none | yes | no | Receives `:username` and, without `password_verify_hash_column`, `:password`. |
| `auth_queries.<name>.username_regex` | string (PCRE with delimiters) | unset | no | no | Query is skipped when the username does not match. |
| `auth_queries.<name>.extract_userid_from` | string | unset | no | no | Column whose value becomes `:userid` for attribute queries. |
| `auth_queries.<name>.password_verify_hash_column` | string | unset | no | no | Switches to `password_verify()` against that column; the column is dropped from the attributes. |
| `attr_queries` | list of query objects | unset | no | | |
| `attr_queries[].database` | string | none | yes | no | Must be a key of `databases`. |
| `attr_queries[].query` | string (SQL) | none | yes | no | Receives `:username` or `:userid`. |
| `attr_queries[].only_for_auth` | list of strings | unset | no | no | Each must be a key of `auth_queries`. |

Plus the `UserPassBase` options above.

### Deprecated formats

`sqlauth:SQL` / `sqlauth:SQL1Compat` (`src/Auth/Source/SQL1Compat.php`):

| Name | Type | Default | Required | Secret | Notes |
| --- | --- | --- | --- | --- | --- |
| `dsn` | string | none | yes | possibly | |
| `username` | string | none | yes | no | Read unconditionally, then validated as a string by `SQL2`. |
| `password` | string | none | yes | **yes** | Same. |
| `query` | string or list of strings | none | yes | no | First entry authenticates, the rest become attribute queries. |
| `username_regex` | string | unset | no | no | |

`sqlauth:PasswordVerify` / `sqlauth:PasswordVerify1Compat` adds `passwordhash_column` (string, default `'passwordhash'`). The module's docs spell it `passwordhashcolumn`; the code reads `passwordhash_column`.

## `multiauth:MultiAuth`

Read in `modules/multiauth/src/Auth/Source/MultiAuth.php` and `modules/multiauth/templates/selectsource.twig`.

| Name | Type | Default | Required | Secret | Notes |
| --- | --- | --- | --- | --- | --- |
| `sources` | map of authsource id to source object | none | yes | no | Keys reference other entries of `authsources.php`. |
| `sources.<id>.text` | localized | the id | no | no | Button label. |
| `sources.<id>.help` | localized | unset | no | no | |
| `sources.<id>.css_class` | string | `''` | no | no | |
| `sources.<id>.AuthnContextClassRef` | string or list of strings | unset | effectively yes when SPs send a RequestedAuthnContext | no | Read without an existence check in `authenticate()` when the request carries a `RequestedAuthnContext`. |
| `preselect` | string | unset | no | no | Must be a key of `sources`. |

## `exampleauth:UserPass`

Read in `modules/exampleauth/src/Auth/Source/UserPass.php`.

| Name | Type | Default | Required | Secret | Notes |
| --- | --- | --- | --- | --- | --- |
| `users` | map of `"<username>:<password>"` to attribute map | none | yes (legacy mode otherwise) | **yes, in the keys** | Without `users`, the whole config array is read as the user map and a warning is logged. Attribute maps go through `normalizeAttributesArray` (name to string or list of strings). |

Plus the `UserPassBase` options above.

## Other in-core types, for completeness

- `core:AdminPassword`: no options of its own beyond `UserPassBase`. Username is forced to `admin`; the password is global `auth.adminpassword`.
- `core:SourceIPSelector`: `zones` (required) is a map with a mandatory `default` key (authsource id or `null`) and named zones `{source: string, subnet: list of CIDR}`.
- `core:RequestedAuthnContextSelector`: `contexts` (required) is a map with a mandatory `default` key (authsource id, or a context object) and integer-keyed entries `{identifier: string, source: string}`.
- `exampleauth:UserClick`: `users` (required), a list of attribute maps.
- `exampleauth:StaticSource`: the whole array (minus key `0`) is the attribute map.
- `authcrypt:Hash`: the whole array is a map of `"<username>:<hash>"` to attribute map. `authcrypt:Htpasswd`: `htpasswd_file` (path) and `static_attributes`.

## Options that are not JSON-representable, or only awkwardly

Not representable:

- **`saml:SP` `saml:Extensions` and `saml:logout:Extensions`.** The values are handed straight to `setExtensions()` of the saml2 library, which expects XML chunk objects built from a DOM element. They cannot be stored as JSON without a Console-specific encoding (for example an XML string that the fragment turns into objects), so v1 should leave them unsupported.
- **`authproc` in general.** The structure (integer priority to filter array) is JSON-representable, but its contents are open-ended: every filter has its own options, third-party filters are unknown to any schema, and `core:PHP` carries executable code in its `code` string. A JSON Schema can only validate the envelope. Closures and class instances are not used by the core filters' documented configuration, but nothing prevents a third-party filter from expecting them: unverified beyond core.

Representable, but the schema must deviate from a plain mirror of the PHP array:

- **The positional type string (key `0`).** JSON has no mixed list/map. Storing it as a separate `type` field and re-inserting it at index `0` when the Snapshot is rendered is the simplest mapping. (PHP's `json_decode(..., true)` turns an object key `"0"` into integer key `0`, which would also work; PHP was not available in the research sandbox, so this was not executed.)
- **Credentials in keys**: `exampleauth:UserPass` `users` and `authcrypt:Hash`. `x-sensitive` annotates a property value, not a property name. The Console model needs `{username, password, attributes}` records that are flattened to `"user:pass"` keys on render.
- **Absent versus `null`**: `ldap:Ldap` `attributes`. The form must offer three states (not set, all attributes, explicit list), and serialisation must not drop `null`.
- **Union types**: `saml.SOAPClient.certificate` (string or `false`), `AuthnContextClassRef` (string or list), every localized option (string or map), `core:RequestedAuthnContextSelector` `contexts.default` (string or object).
- **Mixed list/map**: `saml:SP` `attributes` (positional entries mixed with friendly-name keys).
- **Integer-keyed maps**: `authproc` priorities, `core:RequestedAuthnContextSelector` `contexts`, and `sqlauth` `databases.<name>.options`, whose keys are PDO constants (`PDO::ATTR_*`, `PDO::MYSQL_ATTR_SSL_CA`, ...). Raw integers are opaque and driver-specific; a schema needs a symbolic name mapping.
- **Reserved key inside a user-keyed map**: `default` in `zones` and `contexts`.
- **Class names as values**: `ldap:Ldap` `connector`. It is a string, but the module instantiates it, so the schema should restrict it to an enum of the two shipped connectors.
- **PHP constants in documentation**: the docs write values such as `\SAML2\Constants::NAMEID_PERSISTENT` or `0x00`. These are plain strings and integers at runtime, so they are representable; the schema should carry the literal URIs.

## Secret fields per type

| Type | Fields for `x-sensitive` |
| --- | --- |
| `saml:SP` | `privatekey_pass`, `new_privatekey_pass`, `saml.SOAPClient.privatekey_pass`. Key locations are references, not secrets. `authproc` may hold secrets depending on the filter. |
| `ldap:Ldap` | `search.password`, `priv.password` |
| `ldap:LdapMulti` | none |
| `sqlauth:SQL2` | `databases.<name>.password`; `databases.<name>.dsn` when it embeds credentials |
| `sqlauth:SQL`, `sqlauth:PasswordVerify` | `password`; `dsn` when it embeds credentials |
| `multiauth:MultiAuth` | none |
| `exampleauth:UserPass` | the password half of each `users` key |
| `core:AdminPassword`, selectors | none |
| `authcrypt:Hash` | the hash half of each key (a hash, still sensitive) |

Not secret but personal data: `saml:SP` `contacts`.

## Conflicts with the map

- **Key storage versus "SSO requests never read the database".** Core 2.5 already supports database-stored keys through `pdo://<id>` locations, but they are fetched from the global `database.*` connection at request time, on every signature or decryption. Using that mechanism for managed `saml:SP` authsources (or hosted IdPs) makes SSO depend on the database, which contradicts the settled Snapshot constraint. Keys kept in the Console database would have to be materialised into the Snapshot (as files, or as inline `certData` for the public half; `privatekey` has no inline form) to honour it.
- **Type names in the brief.** `userpass:Database` does not exist, `ldap:LDAP` must be `ldap:Ldap`, and `sqlauth:SQL` is deprecated in favour of `sqlauth:SQL2` in the only sqlauth release line that supports 2.5.
- **The working hypothesis for managed authsources holds** as far as these types are concerned: both core and the ldap module resolve authsources only through `Configuration::getConfig('authsources.php')`, so a fragment in that file that merges the Snapshot is sufficient and nothing else would be. One consequence: `multiauth`, the selectors and `ldap:LdapMulti` reference other authsources by id, so collisions between file-defined and managed ids ("the file wins") can silently change what a managed source points at; Publication should validate references against the merged view.
