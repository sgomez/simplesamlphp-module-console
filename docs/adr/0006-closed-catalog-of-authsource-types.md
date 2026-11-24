# Closed catalog of Authsource types, each with its own document and translator

Several authsource options do not fit JSON as core expects them: the type at key `0`, credentials inside array keys, absent versus `null`, integer-keyed maps. A managed authsource is therefore stored as a Console document described by a closed JSON Schema, and a PHP class per Authsource type translates it into the array core expects. The catalog ships with the module and holds five types in v1: `saml:SP`, `ldap:Ldap`, `sqlauth:SQL2`, `multiauth:MultiAuth` and `exampleauth:UserPass`.

## Considered Options

- **Generic type (free JSON for any class)**: rejected; without a schema the Console cannot tell which fields are sensitive, so it would show them unmasked.
- **Catalog extensible by the deployment or other modules**: rejected for v1; it would freeze the schema format and its annotations as a public contract before they are proven. It can be opened later without breaking anything.
- **Schema mirroring the PHP array**: rejected; the awkward options would live as schema conventions instead of tested code.
- **Instantiating the authsource class at Publication**: rejected; it runs third-party constructors inside the Console, with Secret references that node may not resolve. The schema-to-class contract is checked in the test suite instead.
- **Translating at Publication**: rejected; a Secret reference must fill a whole value, and translation can move a value into an array key (`exampleauth:UserPass`).

## Consequences

- An authsource of an uncatalogued type, or one needing an uncatalogued option, stays a File authsource.
- The Snapshot carries Console documents. Each node resolves Secret references first and translates afterwards, so every node runs the translators and must carry the same module version as the Console. A node that cannot translate a document drops that authsource.
- Validation runs on save: the schema, plus cross-field rules in the type's class. A Publication revalidates everything against the current schemas, so a module update that tightens a schema can block Publication until the stored document is fixed or disabled; the current Snapshot keeps being served.
- Schemas are JSON Schema 2020-12, validated with `opis/json-schema`; `justinrainbow/json-schema` silently skips 2020-12 keywords.
