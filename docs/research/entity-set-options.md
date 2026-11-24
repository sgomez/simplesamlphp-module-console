# Options core reads per managed entity set

Research for issue #41. Baseline: SimpleSAMLphp 2.5.

## Sources

| Short name | Repository | Ref | Commit |
| --- | --- | --- | --- |
| core | `simplesamlphp/simplesamlphp` | branch `simplesamlphp-2.5` | `6e34a73985f63aac5326e0c1f416bf3efc047c90` |
| saml2-legacy | `simplesamlphp/saml2-legacy` | tag `v4.21.1` | `cdf91f7691017973e9668b9d5071250caae36146` |

Core 2.5 requires `simplesamlphp/saml2-legacy: ~4.20` (`composer.lock` pins `v4.20.7`); the `SAML2\` classes used by the `saml` module come from it. Core also requires `simplesamlphp/saml2: ~6.1`, but no entity option is read through it.

Reference docs: `docs/simplesamlphp-reference-sp-remote.md`, `-idp-remote.md`, `-idp-hosted.md`, plus the pages they link (`simplesamlphp-metadata-endpoints.md`, `simplesamlphp-metadata-extensions-*.md`, `simplesamlphp-advancedfeatures.md`).

Method: every option name in the three references was searched as a literal in `src/` and `modules/*/src` (tests excluded), and every `Configuration` getter and array access on entity metadata in the `saml` module, `core` module, `src/SimpleSAML/IdP.php`, `Metadata/`, `XHTML/` and `Utils/` was listed to find undocumented reads. All findings come from reading the code; nothing was executed.

Abbreviations for file paths (all relative to core unless prefixed):

| Short | File |
| --- | --- |
| `SAML2` | `modules/saml/src/IdP/SAML2.php` |
| `Message` | `modules/saml/src/Message.php` |
| `SP` | `modules/saml/src/Auth/Source/SP.php` |
| `SPCtl` | `modules/saml/src/Controller/ServiceProvider.php` |
| `Cfg` | `src/SimpleSAML/Configuration.php` |
| `Crypto` | `src/SimpleSAML/Utils/Crypto.php` |
| `MdUtil` | `src/SimpleSAML/Utils/Config/Metadata.php` |
| `Chain` | `src/SimpleSAML/Auth/ProcessingChain.php` |
| `Limit` | `modules/core/src/Auth/Process/AttributeLimit.php` |
| `Builder` | `src/SimpleSAML/Metadata/SAMLBuilder.php` |
| `Handler` | `src/SimpleSAML/Metadata/MetaDataStorageHandler.php` |
| `Source` | `src/SimpleSAML/Metadata/MetaDataStorageSource.php` |
| `Signer` | `src/SimpleSAML/Metadata/Signer.php` |
| `Disco` | `src/SimpleSAML/XHTML/IdPDisco.php` |
| `Tpl` | `src/SimpleSAML/XHTML/Template.php` |
| `CoreLogout` | `modules/core/src/Controller/Logout.php` |

Column meaning: **Ref** = listed in the set's reference page (`link` = only in a linked page). **Fallback** = where the value comes from when the option is unset on this entity. **Sens.** = sensitive. "the SP" in the idp-remote tables is the `saml:SP` authsource talking to that IdP.

## Cross-cutting facts

- `Cfg::hasValue()` treats `null` as unset (`Cfg`:441-444), and every `getOptional*` returns the default for `null`. An absent key and `null` are equivalent everywhere; a closed schema needs no `null` type.
- Endpoints: `Cfg::getEndpoints()` (`Cfg`:1201-1267) accepts only a list of arrays. Each needs `Location` (string); `Binding` (string) defaults per set (`Cfg`:1172-1189); `index` must be int; `ResponseLocation` must be string; `isDefault` is read in `SAML2`:226-256 and `MdUtil::getDefaultEndpoint`. The string shorthand of older versions throws.
- Localized strings: `Cfg::getLocalizedString()` accepts a string (becomes `['en' => ...]`, `Cfg`:1357-1358) or a language map. The display helpers `Tpl::getEntityDisplayName()` (`Tpl`:661-677) and `getEntityPropertyTranslation()` (`Tpl`:689-700) index by language and silently ignore a plain string. Always writing a language map is the only shape that works on both paths.
- Certificates: `Cfg::getPublicKeys($use, $required, $prefix)` (`Cfg`:1411-1480) reads `<prefix>keys`, else `<prefix>certData`, else `<prefix>certificate`, plus `<prefix>key_name`. Private keys: `Crypto::loadPrivateKey()` (`Crypto`:205-233) reads `<prefix>privatekey` and `<prefix>privatekey_pass`. Prefixes in use: `''`, `new_`, `signature.`, `https.`, `metadata.sign.`.
- Signing/validation precedence is not uniform (`Message`:99-128, 228-266). `src` is the sender, `dst` the recipient:
  - `sign.logout`, `sign.authnrequest`: **sender first**, recipient second. For a hosted IdP the idp-hosted value wins over sp-remote; for a hosted SP the authsource wins over idp-remote. Both references state the opposite.
  - `redirect.sign`: recipient (remote) first, then sender, default `false`.
  - `validate.logout`, `validate.authnrequest`, `redirect.validate`: sender (remote) first, then recipient, default `false`.
  - `validate.*` is tri-state: unset means "validate if a signature is present", `false` means "never validate, even when signed" (`Message`:246-258).
  - `signature.algorithm`: recipient (remote) first, then sender, default RSA-SHA256 (`Message`:65-68).
- `authproc` is never a fallback: `config.php` `authproc.idp`/`authproc.sp`, the IdP-side entity and the SP-side entity are all merged and ordered by priority (`Chain`:72-87).
- `entityid`, `metadata-set`, `metadata-index` are injected by `Handler`:350-351; `expire` is enforced in `Handler`:155, 289, 327.

## `saml20-sp-remote`

| Option | Ref | Read at | PHP shapes | Default | Fallback | Sens. | Schema note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `AssertionConsumerService` | y | `SAML2`:215, 295 | endpoint list | none (no usable endpoint is an error) | none | n | Fits the endpoint model |
| `SingleLogoutService` | y | `SAML2`:556, 612, 727; `CoreLogout`:238 | endpoint list; `ResponseLocation` used at `SAML2`:620-621 | `[]` | none | n | Endpoint model needs `ResponseLocation` |
| `SingleLogoutServiceResponse` | y | **not read** (only a docblock, `SAMLParser.php`:645) | - | - | - | n | Do not catalog; `ResponseLocation` replaces it |
| `attributes` | y | `Limit`:96-98, only when `core:AttributeLimit` runs | list of names, or map name => list of allowed values, or both mixed (`Limit`:59-82, 151-166) | no limit | idp-hosted `attributes` (`Limit`:100-102) | n | Mixed list/map; remodel as a list of `{name, values?}` |
| `attributesRegex` | n (`modules/core/docs/authproc_attributelimit.md`) | `Limit`:116-118 | list of regex strings | none | idp-hosted | n | |
| `authproc` | y | `Chain`:84-85 | map int priority => string or array | none | merged, see above | maybe (filter options) | Decided: free-form envelope |
| `description` | y | **not read** by core for this set | - | - | - | n | Display-only for other modules |
| `name` | y | `IdP.php`:201-202; `Tpl`:668 | string or language map | `OrganizationDisplayName`, then entityid | none | n | Always a language map |
| `OrganizationName` | y | `Tpl`:672 (display fallback) | language map | - | none | n | |
| `OrganizationDisplayName` | y | `IdP.php`:203-204; `Tpl`:670 | string or language map | - | none | n | |
| `OrganizationURL` | y | **not read** for remote sets | - | - | - | n | |
| `attributeencodings` | y | `SAML2`:1023 | map attribute name => `string`/`base64`/`raw` | `[]` (`string`) | merged per attribute over idp-hosted (`SAML2`:1022-1029) | n | Map keyed by arbitrary names |
| `attributes.NameFormat` | y | `SAML2`:1093 | string | `urn:oasis:names:tc:SAML:2.0:attrname-format:uri` | sp-remote `AttributeNameFormat`, idp-hosted `attributes.NameFormat`, idp-hosted `AttributeNameFormat` | n | |
| `AttributeNameFormat` | n | `SAML2`:1097 | string | - | see above | n | Legacy alias; do not catalog |
| `audience` | y | `SAML2`:1156 | list of strings | `[]` | none | n | |
| `encryption.blacklisted-algorithms` | y | **not read** for this set: the only readers are SP-side (`Message`:354-356) | - | - | - | n | Do not catalog |
| `ForceAuthn` | y | `SAML2`:482 | bool | `false` | none (a `true` in the request wins) | n | |
| `NameIDFormat` | y | `SAML2`:1292 (first element only); `SQLPersistentNameID.php`:115 | string or list of strings | `[]` | idp-hosted `NameIDFormat`, then transient | n | Union; always a list |
| `nameid.encryption` | y | `SAML2`:1263, 1437; `CoreLogout`:223 | bool | `false` | idp-hosted | n | |
| `saml20.sign.response` | y | `SAML2`:1463 | bool | `true` | idp-hosted | n | |
| `saml20.sign.assertion` | y | `SAML2`:1139 | bool | `true` | idp-hosted | n | |
| `signature.algorithm` | y | `Message`:65 | string | RSA-SHA256 | idp-hosted | n | Enum of four URIs |
| `signature.privatekey`, `signature.privatekey_pass`, `signature.certificate` | y | `Message`:52-58 via `Crypto` | strings | idp-hosted key | idp-hosted | `_pass`: y | Key reference. `signature.certData`, `signature.keys`, `signature.key_name` are also read through the prefix and are undocumented |
| `sign.logout` | y | `Message`:108 | bool | `redirect.sign` | **idp-hosted is read first** (`Message`:106) | n | Precedence contradicts the reference |
| `redirect.sign` | y | `Message`:118 | bool | `false` | idp-hosted | n | |
| `validate.authnrequest` | y | `Message`:240 | bool | tri-state, see above | idp-hosted, then `redirect.validate` | n | Absent and `false` differ; do not default to `false` |
| `validate.logout` | y | `Message`:235 | bool | tri-state | idp-hosted, then `redirect.validate` | n | Same |
| `redirect.validate` | y | `Message`:254 | bool | `false` | idp-hosted | n | |
| `simplesaml.attributes` | y | `SAML2`:1252 | bool | `true` | none | n | |
| `SPNameQualifier` | y | `SAML2`:1317 (fallback transient NameID only) | string | entityid | none | n | |
| `skipEndpointValidationWhenSigned` | y | `SAML2`:259-271 | bool or callable | `false` | none | n | Callable is not representable; bool only |
| `assertion.encryption` | y | `SAML2`:1356 | bool | `false` | idp-hosted | n | |
| `sharedkey` | y | `SAML2`:1366; `Message`:1160 | string | none (public key encryption) | none | **y** | |
| `sharedkey_algorithm` | y | `SAML2`:1368 | string | AES128-GCM | idp-hosted | n | Enum |
| `IDPList` | y | `SAML2`:476 | string or list of strings | `[]`, merged with the request's list | none | n | Union; always a list |
| `certificate`, `certData` | y | `Cfg`:1411-1480 via `Message`:144 (signing), `SAML2`:1377 and `Message`:1167 (encryption) | strings | none | none | n | Key reference |
| `keys`, `key_name` | n | same | list of key arrays; string | - | none | n | Key reference |
| `ProxyCount` | n | `SAML2`:478 | int | none | none (request value wins) | n | |
| `assertion.lifetime` | n | `SAML2`:1161, 1431; `CoreLogout`:217 | int (seconds) | `300` | idp-hosted | n | |
| `core:statistics-id` | n | `SAML2`:686 | string | entityid | none | n | |
| `core:logout-timeout` | n | `CoreLogout`:309 | int (seconds) | `5` | none | n | |
| `UIInfo.DisplayName` | n | `Tpl`:666 | language map | - | none | n | Display only |

## `saml20-idp-remote`

| Option | Ref | Read at | PHP shapes | Default | Fallback | Sens. | Schema note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `SingleSignOnService` | y | `SP`:664-685; `saml/src/Auth/Process/FilterScopes.php`:72 | endpoint list | required | none | n | |
| `SingleLogoutService` | y | `SP`:1088; `SPCtl`:671, 681 (`ResponseLocation`) | endpoint list | none (no SLO) | none | n | Needs `ResponseLocation` |
| `SingleLogoutServiceResponse` | y | **not read** | - | - | - | n | Do not catalog |
| `ArtifactResolutionService` | n | saml2-legacy `src/SAML2/HTTPArtifact.php`:116 | endpoint list, `index` used | none | none | n | |
| `AuthnContextClassRef` | y | `SP`:506-507 | **string only** (`getOptionalString`; an array throws) | none | request state, else the SP's own value (`Message`:533-534, string or list) | n | The reference does not say it is single-valued here |
| `AuthnContextComparison` | y | `SP`:514-515 | string, not checked against the enum on this path | `exact` | the SP | n | Enum `exact`/`minimum`/`maximum`/`better` |
| `authproc` | y | `Chain`:79-80 | map int priority => string or array | none | merged with `authproc.sp` and the SP | maybe | Envelope |
| `base64attributes` | y | **not read** by core (removed in 2.0, `docs/simplesamlphp-upgrade-notes-2.0.md`:71); only saml2-legacy `SimpleSAMLConverter.php`:94, which core does not call | - | - | - | n | Do not catalog |
| `certificate`, `certData` | y | `Cfg`:1411-1480 via `Message`:144, 1167; saml2-legacy `SOAPClient.php`:90 | strings | none | none | n | Key reference |
| `keys`, `key_name` | n | same | - | - | none | n | Key reference |
| `description` | y | `Disco`:595 | language map only (a string is ignored) | none | none | n | |
| `disable_scoping` | y | `SP`:604 | bool | `false` | OR-ed with the SP's `disable_scoping`; either `true` disables | n | |
| `encryption.blacklisted-algorithms` | y | `Message`:354 | list of strings | `[rsa-1_5]` | the SP | n | |
| `hide.from.discovery` | y | `Disco`:497 | bool, compared with `=== true` | `false` | none | n | |
| `icon` | y | `Disco`:596-598 | string (URL) | none | none | n | |
| `IDPList` | y | `SP`:611-612 | list of strings (`getOptionalArray`; a string throws) | `[]` | used only when request state and the SP's `IDPList` are both empty | n | |
| `name` | y | `Tpl`:668 via `Disco`:593 | language map only | `Organization*`, then entityid | none | n | |
| `nameid.encryption` | y | `SP`:1113 | bool | `false` | the SP | n | |
| `NameIDPolicy` | y | `Message`:499-500, parsed by `MdUtil`:251-279 | `[]` or `{Format?: string, AllowCreate?: bool, SPNameQualifier?: string}` | transient, `AllowCreate` false | the SP | n | **Read but overwritten**: `SP`:594-597 then calls `setNameIdPolicy()` with request state or the SP's own `NameIDPolicy` (default `[]`) unconditionally. By reading, the idp-remote value never reaches the request. Not verified by execution |
| `OrganizationName`, `OrganizationDisplayName` | y | `Tpl`:670-672 via `Disco`:593 | language map | - | none | n | Display fallback |
| `OrganizationURL` | y | **not read** | - | - | - | n | |
| `scope` | y | `FilterScopes.php`:69-70, only when `saml:FilterScopes` runs | list of strings | host of the default SSO endpoint | none | n | |
| `signature.algorithm` | y | `Message`:65 | string | RSA-SHA256 | the SP | n | Enum |
| `sign.authnrequest` | y | `Message`:113 | bool | `redirect.sign` | **the SP is read first** (`Message`:111) | n | Precedence contradicts the reference |
| `sign.logout` | y | `Message`:108 | bool | `redirect.sign` | **the SP is read first** (`Message`:106) | n | Same |
| `redirect.sign` | y | `Message`:118 | bool | `false` | the SP | n | |
| `validate.logout` | y | `Message`:235 | bool | tri-state | the SP, then `redirect.validate` | n | Absent and `false` differ |
| `redirect.validate` | y | `Message`:254 | bool | `false` | the SP | n | |
| `SPNameQualifier` | y | **not read** at top level; only as a key inside `NameIDPolicy` (`MdUtil`:273) | - | - | - | n | Do not catalog at top level |
| `assertion.encryption` | y | `Message`:381 | bool | `false` | the SP | n | |
| `sharedkey` | y | `Message`:286, 1160 | string | none | none | **y** | |
| `sharedkey_algorithm` | y | `Message`:293 | string | AES128-GCM | the SP | n | Enum |
| `signature.privatekey`, `signature.privatekey_pass`, `signature.certificate` | n | `Message`:52-58 | strings | the SP's key | the SP | `_pass`: y | Key reference; same code path as sp-remote |
| `ProxyCount` | n | `SP`:617-618 | int | none | the SP (request state wins) | n | |
| `hint.cidr` | n | `Source`:196-197 | list of CIDR strings | none | none | n | Preselects the IdP in discovery |
| `DiscoHints.IPHint` | link (`simplesamlphp-metadata-extensions-ui.md`) | `Source`:202-207 | list of CIDR strings | none | none | n | Merged with `hint.cidr` |
| `UIInfo.DisplayName` | link | `Tpl`:666 | language map | - | none | n | Wins over `name` in discovery |
| `attributes`, `attributesRegex` | n | `Limit`:100-102, 120-122 (as `Source` in SP mode) | as in sp-remote | none | none | n | |

## `saml20-idp-hosted`

| Option | Ref | Read at | PHP shapes | Default | Fallback | Sens. | Schema note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `host` | y | `Source`:157-161, 322; `SAML2`:784; `modules/admin/src/Controller/Federation.php`:222 | string: hostname, host/path or `__DEFAULT__` | required in practice (`Source`:322 reads it unguarded) | none | n | Part of entity identity on a node |
| `auth` | y | `IdP.php`:107 | string (authsource id) | required | none | n | Reference to an authsource |
| `authproc` | y | `Chain`:79-80 | map int priority => string or array | none | merged with `authproc.idp` and sp-remote | maybe | Envelope |
| `certificate`, `privatekey`, `privatekey_pass` | y | `Crypto`:211, 228 via `Message`:60-61, `SAML2`:869; `Signer`:98-117 (last resort for metadata signing) | strings | required | none | `_pass`: y | Key reference |
| `certData`, `keys`, `key_name` | n | `Cfg`:1411-1480 | - | - | none | n | Key reference |
| `new_certificate` (`new_certData`, `new_keys`) | n (`modules/saml/docs/keyrollover.md`) | `SAML2`:854 | string | none | none | n | Key reference; published in metadata only |
| `new_privatekey`, `new_privatekey_pass` | n (same) | only `modules/saml/src/Event/Listener/SamlSanityCheckListener.php`:45 | string | none | none | `_pass`: y | The hosted IdP never decrypts, so no protocol code reads them |
| `https.certificate` | y | `SAML2`:879-881 | string | none | none | n | Key reference; `https.certData`, `https.keys` also read through the prefix |
| `contacts` | y | `SAML2`:983-987, validated by `MdUtil`:81-166 | list of `{contactType (required enum), emailAddress: string or list, telephoneNumber: string or list, givenName, surName, company, attributes}` | none | `config.php` `technicalcontact_email`/`technicalcontact_name` is **appended** as one more contact (`SAML2`:990-998) | n (personal data) | Two unions, always lists. `attributes` must be a map with string keys (`MdUtil`:97-103) handed to saml2-legacy `ContactPerson::setContactPersonAttributes()` (name => value). The reference's SIRTFI example (a list of `{namespaceURI, namespacePrefix, attrName, attrValue}`) has no string keys and is rejected by this check |
| `errorURL` | y | `SAML2`:969-970; `Builder`:545-546 | string | none | none | n | |
| `logouttype` | y | `IdP.php`:428 | `traditional` or `iframe` | `traditional` | none | n | Enum |
| `OrganizationName` | y | `SAML2`:924-925 | string or language map | none | none | n | Always a language map |
| `OrganizationDisplayName` | y | `SAML2`:926-929 | string or language map | `OrganizationName` | none | n | Optional in code; the reference says all three or none |
| `OrganizationURL` | y | `SAML2`:931-934 | string or language map | required when `OrganizationName` is set (throws) | none | n | Conditional requirement |
| `scope` | y | `SAML2`:938-939; `Builder`:146-156 | list of strings; regex detected by metacharacters | none | none | n | |
| `assertion.encryption` | y | `SAML2`:1358 | bool | `false` | sp-remote is read first | n | |
| `attributeencodings` | y | `SAML2`:1022 | map name => encoding | `[]` | sp-remote merged on top | n | Map keyed by arbitrary names |
| `attributes.NameFormat` | y | `SAML2`:1103 | string | URI format | sp-remote first | n | |
| `AttributeNameFormat` | n | `SAML2`:1107 | string | - | - | n | Legacy alias; do not catalog |
| `encryption.optional` | y | `SAML2`:1393 | bool | `false` | none | n | |
| `encryption.blacklisted-algorithms` | y | **not read** for this set (readers are SP-side only) | - | - | - | n | Do not catalog |
| `nameid.encryption` | y | `SAML2`:1265, 1439; `CoreLogout`:225 | bool | `false` | sp-remote first | n | |
| `NameIDFormat` | y | `SAML2`:828, 1295 | string or list of strings | `[transient]` | sp-remote first for the format issued | n | Union; always a list |
| `RegistrationInfo` | y | `SAML2`:964-965; `Builder`:189-203 | `{authority: string, instant: xs:dateTime string, policies: language map}` | none | none | n | Fixed keys; closable |
| `saml20.ecp` | y | `SAML2`:318, 915 | bool | `false` | none | n | |
| `saml20.hok.assertion` | y | `SAML2`:315, 903, 1204 | bool | `false` | none | n | |
| `saml20.sendartifact` | y | `SAML2`:312, 894; `modules/saml/src/Controller/WebBrowserSingleSignOn.php`:62 | bool | `false` | none | n | |
| `saml20.sign.assertion` | y | `SAML2`:1141 | bool | `true` | sp-remote first | n | |
| `saml20.sign.response` | y | `SAML2`:1465 | bool | `true` | sp-remote first | n | |
| `signature.algorithm` | y | `Message`:67 | string | RSA-SHA256 | sp-remote first | n | Enum |
| `sign.logout` | y | `Message`:106 | bool | `redirect.sign` | **read before sp-remote** | n | |
| `redirect.sign` | y | `Message`:120 | bool | `false` | sp-remote first | n | |
| `validate.authnrequest` | y | `Message`:242; `SAML2`:974-975 (published as `WantAuthnRequestsSigned`) | bool | tri-state | sp-remote first | n | Absent and `false` differ |
| `validate.logout` | y | `Message`:237 | bool | tri-state | sp-remote first | n | Same |
| `redirect.validate` | y | `Message`:256; `SAML2`:978-979 | bool | `false` | sp-remote first | n | |
| `SingleSignOnService` | y | `Handler`:94-99 via `SAML2`:790 | **string** (absolute URL), used as the `Location` of every binding (`SAML2`:793-807) | `<base>module.php/saml/idp/singleSignOnService` | none | n | Not an endpoint list; an array breaks metadata generation |
| `SingleSignOnServiceBinding` | y | `SAML2`:788 | string or list of strings | HTTP-Redirect | none | n | Union; always a list |
| `SingleLogoutService` | y | `SAML2`:791 | **string** | `<base>module.php/saml/idp/singleLogout` | none | n | Same as SSO |
| `SingleLogoutServiceBinding` | y | `SAML2`:789 | string or list of strings | HTTP-Redirect | none | n | Union; always a list |
| `saml:Extensions` | y | `SAML2`:952-953; `Builder`:183-185 | list of `\SimpleSAML\XML\Chunk` **PHP objects** | none | none | n | Not representable in JSON, in the schema or in `extra` |
| `metadata.sign.enable` | link (`simplesamlphp-advancedfeatures.md`:64) | `SAML2`:832-833; `Signer`:137-145; `Handler`:336 | bool (anything else throws) | `false` | `config.php` `metadata.sign.enable` | n | |
| `metadata.sign.privatekey`, `metadata.sign.privatekey_pass`, `metadata.sign.certificate` | link | `SAML2`:835-843; `Signer`:43-66 | strings; privatekey and certificate must come together | none | `config.php` same names, then the entity's `privatekey`/`certificate` | `_pass`: y | Key reference. Ignored with an error log unless `metadata.sign.enable` is set on the entity (`Handler`:336-345) |
| `metadata.sign.algorithm` | link | `SAML2`:844-845; `Signer`:171-196 | string, one of four RSA-SHA URIs | RSA-SHA256 | `config.php` | n | Enum |
| `UIInfo` | link (`-extensions-ui.md`) | `SAML2`:956-957; `Builder`:217-256 | `{DisplayName, Description, InformationURL, PrivacyStatementURL: language maps; Keywords: lang => list; Logo: list of {url, width, height, lang?}}` | none | none | n | Fixed keys; closable |
| `DiscoHints` | link | `SAML2`:960-961; `Builder`:258-274 | `{IPHint, DomainHint, GeolocationHint: lists of strings}` | none | none | n | Fixed keys; closable |
| `EntityAttributes` | link (`-extensions-attributes.md`) | `SAML2`:943-949; `Builder`:160-181 | map attribute name (optionally `{nameformat}name`) => list of strings | none | none | n | Map keyed by arbitrary URIs. The hide-from-discovery category sets `hide.from.discovery` |
| `sharedkey_algorithm` | n | `SAML2`:1371 | string | AES128-GCM | sp-remote first | n | |
| `assertion.lifetime` | n | `SAML2`:1163, 1433; `CoreLogout`:219 | int (seconds) | `300` | sp-remote first | n | |
| `attributes`, `attributesRegex` | n | `Limit`:100-102, 120-122 | as in sp-remote | none | sp-remote first | n | |

`sign.authnrequest` and `hide.from.discovery` appear in the generated hosted metadata but are derived (`SAML2`:948, 975), not read from the entity.

## Shapes that need remodelling

| Shape | Options | Suggested document shape |
| --- | --- | --- |
| string or list of strings | `NameIDFormat`, `IDPList` (sp-remote), `SingleSignOnServiceBinding`, `SingleLogoutServiceBinding`, contact `emailAddress`/`telephoneNumber` | always a list |
| string or language map | `name`, `description`, `Organization*` | always a language map (already decided) |
| map keyed by arbitrary strings | `attributeencodings`, `EntityAttributes`, contact `attributes`, `authproc` | object with typed `additionalProperties`, or a list of pairs; `authproc` stays an envelope |
| mixed list and map | `attributes` | list of `{name, values?}`, translated back to the mixed array |
| bool or callable | `skipEndpointValidationWhenSigned` | bool only |
| PHP objects | `saml:Extensions` | not expressible; unsupported unless modelled as XML text built into `Chunk` on the node |
| tri-state bool | `validate.authnrequest`, `validate.logout` | optional boolean with no schema default |
| string that is single-valued only here | idp-remote `AuthnContextClassRef` | string, not list |
| scalar URL plus separate binding list | idp-hosted `SingleSignOnService`/`SingleLogoutService` with `*Binding` | see open points |

## Documented but not read by 2.5 code

- sp-remote: `SingleLogoutServiceResponse`, `description`, `OrganizationURL`, `encryption.blacklisted-algorithms`.
- idp-remote: `SingleLogoutServiceResponse`, `base64attributes`, `OrganizationURL`, top-level `SPNameQualifier`; `NameIDPolicy` is read and then overwritten.
- idp-hosted: `encryption.blacklisted-algorithms`.

`description` and `OrganizationURL` may still be read by modules outside core (consent, discovery UIs); those are out of scope here.

## Read but missing from the set's reference

- sp-remote: `attributesRegex`, `AttributeNameFormat`, `ProxyCount`, `assertion.lifetime`, `core:statistics-id`, `core:logout-timeout`, `keys`, `key_name`, `signature.certData`/`signature.keys`, `UIInfo.DisplayName`, endpoint `ResponseLocation`.
- idp-remote: `ArtifactResolutionService`, `ProxyCount`, `hint.cidr`, `signature.privatekey`/`_pass`/`certificate`, `attributes`, `attributesRegex`, `keys`, `key_name`, `DiscoHints.IPHint`, `UIInfo.DisplayName`.
- idp-hosted: `sharedkey_algorithm`, `assertion.lifetime`, `AttributeNameFormat`, `attributes`, `attributesRegex`, `certData`, `keys`, `key_name`, `new_*`, `https.certData`/`https.keys`.

## Open points for the catalog

1. **Hosted IdP endpoints are not endpoint lists.** `SingleSignOnService` and `SingleLogoutService` are one URL each, combined with a binding list. A `{Binding, Location}` list in the document only translates back when every entry shares one `Location`.
2. **`ResponseLocation`** is the only working way to give a separate logout-response URL; the decided endpoint shape `{Binding, Location, index?, isDefault?}` lacks it.
3. **`saml:Extensions`** holds PHP objects. It cannot be cataloged as JSON and cannot live in `extra` either.
4. **Rule "reference minus unread"** drops `encryption.blacklisted-algorithms` from two sets and `NameIDPolicy`, `SPNameQualifier`, `base64attributes` from idp-remote. `NameIDPolicy` is the doubtful one: upstream intends it to work, and the overwrite looks like a bug.
5. **Undocumented but useful options** (`assertion.lifetime`, `ProxyCount`, `attributesRegex`, `hint.cidr`, `core:logout-timeout`) fall outside the rule and would go to `extra` unless the rule is widened to "read by core".
6. **`sign.logout`/`sign.authnrequest` precedence** is the reverse of what the reference states; UI help text should follow the code.
7. **Contact `attributes`**: code and reference disagree on the shape; only the name => value map passes validation.
8. **Sensitive options** confirmed: `sharedkey` (sp-remote, idp-remote), `privatekey_pass` and `new_privatekey_pass` (idp-hosted), plus `signature.privatekey_pass` (sp-remote, idp-remote) and `metadata.sign.privatekey_pass` (idp-hosted), which ADR 0008 does not list.

## Not verified

- No code was executed; precedence and the `NameIDPolicy` overwrite come from reading `Message.php` and `SP.php`.
- saml2-legacy was read at `v4.21.1`; the release lock pins `v4.20.7`. The cited files were not diffed between the two.
- Reads by modules outside core 2.5 (`consent`, `discopower`, `adfs`, `metarefresh`, ...) were not surveyed.
- Twig templates were searched only for the display helpers, not for direct array access to entity metadata.
