# Precedence and failure behaviour across `metadata.sources`

Research for issue #4. Source of truth: `simplesamlphp/simplesamlphp`, branch `simplesamlphp-2.5`,
commit `6e34a73985f63aac5326e0c1f416bf3efc047c90` (version 2.5.4, PHP `^8.3` per `composer.json`).
All paths are relative to that tree; line numbers refer to that commit. Base URL for any citation:
`https://github.com/simplesamlphp/simplesamlphp/blob/6e34a73985f63aac5326e0c1f416bf3efc047c90/<path>#L<line>`.

Everything below was read from the source. Nothing was executed; items marked **Unverified** are
inferences that a test should confirm.

Abbreviations: `Handler` = `src/SimpleSAML/Metadata/MetaDataStorageHandler.php`,
`Source` = `src/SimpleSAML/Metadata/MetaDataStorageSource.php`.

## 1. Precedence

Sources are instantiated once per request, in configuration order, in the handler constructor
(`Handler` L62-75, `Source::parseSources` L51-64). The default is `[['type' => 'flatfile']]` (L66).

| Operation | Rule | Evidence |
| --- | --- | --- |
| Single lookup, `getMetaData($entityId, $set)` | First source returning non-null wins; later sources are not consulted. | `Handler` L323-355 |
| Full listing, `getList($set)` | Every source is consulted; on duplicate entity IDs the earlier source wins (`array_merge($srcList, $result)`). | `Handler` L150-169 |
| `getMetaDataForEntities($ids, $set)` | First source wins per entity; resolved IDs are removed before asking the next source. | `Handler` L277-299 |
| `getMetaDataConfigForSha1` | Same merge as `getList`, earlier wins. No expiry check. | `Handler` L392-409 |
| `getPreferredEntityIdFromCIDRhint` | First source with a match wins. | `Handler` L250-257 |

So the rule is uniformly "first source in `metadata.sources` wins". `config/config.php.dist` L1117-1119
documents only "will search through the array from start to end".

Within a single source, duplicate handling is the source's own business. `directory` merges files in
`readdir` order with later files overwriting earlier ones (`MetaDataStorageHandlerDirectory.php` L104-131).

## 2. `saml20-idp-hosted` resolution

### Host lookup

`getMetaDataCurrentEntityID($set, $type)` (`Handler` L199-235) runs three passes, each over **all**
sources in order:

1. host with path (`Utils\HTTP::getSelfHostWithPath()`), L205-210;
2. host only (`getSelfHost()`), L215-220;
3. the literal `__DEFAULT__`, L223-228.

If nothing matches it throws a plain `\Exception` (L231-234).

Consequence: passes take priority over source order. A host-specific entry in the last source beats a
`__DEFAULT__` entry in the first source. Source order only breaks ties within one pass.

Each pass calls `Source::getEntityIdFromHostPath()` (L152-172), whose default implementation loads the
whole set with `getMetadataSet($set)` and compares `$entry['host']` with strict equality. It returns
`$entry['entityid']` when `$type === 'entityid'` and the array index otherwise.

### Entity lookup after the host lookup

Callers then fetch the entity by the returned ID, e.g.
`modules/saml/src/Controller/WebBrowserSingleSignOn.php` L59-60 (`getMetaDataCurrentEntityID` followed
by `getMetaDataConfig`), or `getMetaData(null, $set)`, which resolves the `metaindex` first
(`Handler` L319-321). That second step is an ordinary first-wins lookup across all sources. The source
that matched the host is therefore not necessarily the source that serves the entity: if an earlier
source holds the same entity ID, its copy is used.

### Non-flatfile sources

None of the core handlers overrides `getEntityIdFromHostPath`, so all rely on `getMetadataSet`:

| Type | Serves `saml20-idp-hosted`? | Notes |
| --- | --- | --- |
| `flatfile` | Yes | Forces `entityid` = array key; asserts the key is not `urn:x-simplesamlphp:example-idp` (`MetaDataStorageHandlerFlatFile.php` L140-149). Per-request cache. |
| `directory` | Yes | Same as flatfile over `<set>.d/*.php` and `*.xml` (`MetaDataStorageHandlerDirectory.php` L85-175). |
| `pdo` | Yes | `saml20-idp-hosted` is in `supportedSets` (`MetaDataStorageHandlerPdo.php` L42-48). Host lookup does `SELECT entity_id, entity_data` on the whole table and reads `host` from the JSON (L81-110, L120-137). Per-request cache. |
| `serialize` | Yes | Host lookup scans `<dir>/saml20-idp-hosted/*.serialized` and unserializes every file (`MetaDataStorageHandlerSerialize.php` L118-148). No cache. |
| `xml` | No | Only `saml20-sp-remote`, `saml20-idp-remote`, `attributeauthority-remote` (`MetaDataStorageHandlerXML.php` L98-102). |
| `mdq` | No | `getMetadataSet` is not overridden (base returns `[]`); `getParsedSet` knows only remote sets (`Sources/MDQ.php` L239-253). |

### `__DEFAULT__` and `__DYNAMIC:n__`

- `__DEFAULT__` is not an index. It is a value of the `host` option, matched in pass 3 above and in
  `Source::lookupIndexFromEntityId` (L309-329). Docs: `docs/simplesamlphp-reference-idp-hosted.md`
  L33-36 and L99-102 ("One entry in the metadata-list can have the host `__DEFAULT__`"). Core does not
  enforce uniqueness; with several, the first found wins.
- `__DYNAMIC:n__` no longer exists in 2.5. The string does not appear anywhere under `src/` or
  `modules/`. `docs/simplesamlphp-upgrade-notes-2.0.md` L24-29: entity IDs are no longer
  auto-generated and "Dynamic records are no longer loaded from the database". The array key (or
  `entity_id` column, or file name) must be the real entity ID.
- `lookupIndexFromEntityId` (L315-325) first matches the array index; only if the index differs from
  the requested ID does it compare `$entry['entityid']`, and then it reads `$entry['host']` without an
  existence check. Core handlers always make the index equal to `entityid`, so that branch is
  effectively dead for them. A custom store that keys its set by something other than the entity ID
  must set `host` on every entry or it raises an "undefined array key" warning there.

### Generated endpoints

`getGenerated()` (`Handler` L88-133) returns the entity's own value for a property if present, and
otherwise derives `SingleSignOnService`/`SingleLogoutService` URLs from the current host, or from the
entity's `host` when it is not `__DEFAULT__` (`modules/saml/src/IdP/SAML2.php` L782-790). Any exception
during the lookup is swallowed there (L100-102).

## 3. What core validates on load

Very little. `getMetaData` (`Handler` L317-358) does exactly this to the array a source returns:

1. `expire` check (see section 4);
2. logs an error (does not fail) if `metadata.sign.privatekey`/`certificate` are set without
   `metadata.sign.enable` (L336-348);
3. adds `metadata-index` and `metadata-set` (L350-351);
4. `Assert::keyExists($metadata, 'entityid')` (L352), the only hard structural check.

`getMetaDataConfig` wraps the array with `Configuration::loadFromArray` (L372-376), which only stores it
(`src/SimpleSAML/Configuration.php` L327-337). There is no schema. Options are type-checked lazily, when
a consumer calls a typed getter (`getString`, `getArray`, endpoint getters...), so a malformed option
fails at the point of use, mid-flow, and only on the code path that reads it.

Other checks, all outside the load path:

- Flatfile/directory reject the template entity ID for `saml20-idp-hosted` (see table above).
- `getList` and `getMetaDataForEntities` do not assert `entityid` at all.
- Entity ID syntax and length (`Assert::validURI`, `SAML2INT_ENTITYID_MAX_LENGTH`) are checked for hosted
  IdPs only in the admin federation page (`modules/admin/src/Controller/Federation.php` L245-251) and for
  SP authsources in `modules/saml/src/Auth/Source/SP.php` L111-122 (a URI failure is only logged there).
  Remote entities get no entity ID validation on load.
- The saml sanity check verifies that the hosted IdP key pair matches
  (`modules/saml/src/Event/Listener/SamlSanityCheckListener.php` L23-50), on the admin page only.

Conclusion for the Console: core will not protect it from publishing a bad entity. Publication
validation has to be the module's own.

## 4. `expire`

`expire` is a Unix timestamp. Behaviour differs per operation:

| Operation | Expired entity | Falls through to later sources? | Evidence |
| --- | --- | --- | --- |
| `getMetaData` | Throws plain `\Exception` ("Metadata for the entity [...] expired N seconds ago.") | No. The first source holding the entity decides. | `Handler` L327-334 |
| `getList($set, false)` | Dropped from that source's list with a warning | Yes. A non-expired copy in a later source appears. | `Handler` L153-163 |
| `getList($set, true)` | Kept (used by the admin federation page) | n/a | `Federation.php` L140-144 |
| `getMetaDataForEntities` | Dropped with a warning; the ID stays unresolved | Yes | `Handler` L284-292 |
| `getMetaDataConfigForSha1` | Not checked | n/a | `Handler` L392-409 |

Details: `getMetaData` and `getList` use `array_key_exists('expire')`, so `expire => null` or `0` counts
as expired; `getMetaDataForEntities` uses `!empty()`, so those values count as "no expiry". The MDQ
source additionally discards its own cached copy when expired and refetches (`Sources/MDQ.php` L287-296).
`SAMLParser` sets `expire` from the XML validity attributes (`SAMLParser.php` L568-569, L670-671, L741),
which is how parsed federation metadata acquires it.

Consequence: an expired entry in an early source blocks SSO for that entity even when a later source
has a valid copy, while listings show the later copy.

## 5. Failures

`MetaDataStorageHandler` has no `try`/`catch` around any call into a source. Failure isolation is
entirely up to each source.

**Construction.** All sources are built eagerly on the first `getMetadataHandler()` call. An exception
from any constructor is rethrown as "Invalid configuration of the 'metadata.sources' configuration
option" (`Handler` L68-74) and every metadata operation in the request fails, whichever source the
request needed. An unresolvable module type throws `Error\CriticalConfigurationError`
(`Source` L102-113). Examples in core: `xml` throws if the file cannot be read
(`MetaDataStorageHandlerXML.php` L76-78); `pdo` connects in its constructor through
`Database::getInstance()` and throws on connection failure (`MetaDataStorageHandlerPdo.php` L63-66,
`src/SimpleSAML/Database.php` L167-177). **Unverified** by execution, but it follows from the code:
a `pdo` source anywhere in the list takes down all SSO while the database is unreachable.

**Source throws during a lookup.** The exception propagates. For single lookups, sources placed before
the throwing one still serve their entities (the loop returns before reaching it); entities that would
be found only at or after the throwing source fail. Listings (`getList`, SHA1 lookup, host lookup for
hosted IdPs, CIDR hints) touch every source, so one throwing source breaks them entirely. Uncaught
exceptions end in `Error\ExceptionHandler` (`public/_include.php` L17-18), i.e. the error page.

**Source returns `null`.** Treated as "not here"; the next source is tried. This is how the lenient
handlers behave on damage:

| Type | Unreadable / corrupt data | Result |
| --- | --- | --- |
| `serialize` | Missing file, `IOException`, or `unserialize` failure | Warning, `null`: the entity silently falls through to later sources (`MetaDataStorageHandlerSerialize.php` L164-180). Unreadable set directory: warning, empty set (L122-129). |
| `flatfile` | Missing file | Empty set (`MetaDataStorageHandlerFlatFile.php` L102-104). `$metadata` not an array: throws (L111-113). **Unverified:** a syntax error in the included file would be an uncaught `ParseError`. |
| `directory` | Unopenable directory | Warning, empty set (`MetaDataStorageHandlerDirectory.php` L96-102). |
| `pdo` | Query failure or undecodable JSON row | Throws (`MetaDataStorageHandlerPdo.php` L94-97, L105-109, L168-182). One bad row breaks the whole-set load, hence the hosted-IdP host lookup. |
| `mdq` | HTTP failure | Info log, `null` (`Sources/MDQ.php` L309-316). Signature failure or wrong set: throws (L324-337). Broken cache: logged, refetch (L279-285). |

**Source returns a malformed entity.** If `entityid` is missing, `Assert::keyExists` throws and the
request fails; later sources are not tried. Any other malformation passes the load and fails later, in
whichever consumer reads the bad option. There is no fallback to another source in either case.

Callers that catch: `IdPDisco::validateIdP` (`src/SimpleSAML/XHTML/IdPDisco.php` L248-255),
`getGenerated`, the sanity-check listener and the ADFS association lookup in `src/SimpleSAML/IdP.php`
L95-101. The SSO paths do not (`WebBrowserSingleSignOn.php`, `modules/saml/src/IdP/SAML2.php`,
`SP::getIdPMetadata` at `modules/saml/src/Auth/Source/SP.php` L326-336).

## 6. Contract for a module-provided `MetadataStore`

Resolution (`Source::getSource` L100-116, `src/SimpleSAML/Module.php` L441-483,
`docs/simplesamlphp-maintenance.md` L222-241):

- `'type' => '<module>:<Class>'` resolves to `\SimpleSAML\Module\<module>\MetadataStore\<Class>`, in
  `src/MetadataStore/` of the module. A fully qualified class name without a colon is also accepted.
- The module must be installed and enabled, and the class must exist and be a subclass of
  `\SimpleSAML\Metadata\MetaDataStorageSource`; otherwise `CriticalConfigurationError`.
- It is instantiated as `new $className($sourceConfig)`: the constructor receives the whole source
  array from `config.php`, including `type`. Core handlers declare it `protected` or `public`. It
  should call `parent::__construct()`, which takes no arguments and sets `$this->fileSystem`.

`MetaDataStorageSource` is abstract but declares no abstract methods; every method has a default.
Methods the handler calls:

| Method | Default | Override? |
| --- | --- | --- |
| `getMetadataSet(string $set): array` | `[]` | Required in practice. Must return `[index => entity array]`. Needed for listings, discovery, the admin federation page and, by default, for everything else. |
| `getMetaData(string $entityId, string $set): ?array` | Loads the full set, then `lookupIndexFromEntityId` | Override if loading the set is slow. Return `null` for "not mine". |
| `getEntityIdFromHostPath(string $hostPath, string $set, string $type = 'entityid'): ?string` | Scans the full set for `host` | Override if the set is slow; it runs up to three times per hosted-IdP request. |
| `getMetaDataForEntities(array $entityIds, string $set): array` | One ID: individual lookup; several: full set and intersect | Optional. |
| `getPreferredEntityIdFromCIDRhint(string $set, string $ip, string $type = 'entityid'): ?string` | Scans the full set for `hint.cidr` / `DiscoHints.IPHint` | Optional. |

Obligations on the returned data, since core adds almost nothing:

- every entity must carry `entityid`, and the set should be keyed by it;
- `saml20-idp-hosted` entities need `host` (a host, host/path, or `__DEFAULT__`) to be resolvable;
- return `[]`/`null` for sets the store does not manage;
- the handler caches nothing; the store must cache its own reads (the handler singleton, and so the
  store instance, lives for one request);
- an exception thrown from the constructor or from any method is not contained (section 5). A store
  that must never take SSO down has to catch internally and degrade to `[]`/`null` with a log line.

Save/delete methods (`saveMetadata`, `addEntry`, `removeEntry`) are not part of the base class; they
exist only on individual handlers (`serialize`, `pdo`).

## Implications for the Console

- Whether managed entities override or yield to flat files and metarefresh output is decided purely by
  the position of the Console's source in `metadata.sources`. Core has no other mechanism and no
  collision warning.
- A custom `MetadataStore` reading the Snapshot gives the module control over failure behaviour that
  the stock `serialize` handler does not: `serialize` degrades a corrupt entity to "not found", which
  lets a same-ID entity from a later source (for example a federated copy) silently take over.
- Placing the Console before other sources means an expired or `entityid`-less managed entity blocks
  SSO for that ID even if a later source could serve it.
- With hosted IdPs split across sources, a host-specific entry anywhere beats `__DEFAULT__` anywhere,
  and two `__DEFAULT__` entries are resolved by source order without any warning.
- Core validation on load is limited to `expire` and the presence of `entityid`. Publication must do
  its own validation.
