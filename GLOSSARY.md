# Console

Administrative module for SimpleSAMLphp that manages SAML entities and authentication sources in a database instead of hand-edited PHP files.

## Language

**Console**:
The administrative interface and its database, where administrators edit managed configuration.
_Avoid_: Admin panel, dashboard, backoffice

**Managed entity**:
A SAML entity (`saml20-sp-remote`, `saml20-idp-remote` or `saml20-idp-hosted`) whose metadata is edited in the Console. It is identified by its entity ID together with its set, so the same entity ID may be a managed entity in more than one set.
_Avoid_: Record, metadata row

**Managed authsource**:
An authentication source edited in the Console, as opposed to one declared by hand in `config/authsources.php`.
_Avoid_: DB source, dynamic source

**File authsource**:
An authentication source declared by hand in `config/authsources.php`. The Console lists it but never edits it.
_Avoid_: Static source, legacy source

**Shadowed**:
Said of a managed authsource whose id is also a file authsource on a node. That node serves the file authsource.
_Avoid_: Overridden, conflicting

**Snapshot**:
A complete, validated, numbered and immutable copy of all managed configuration, produced by a Publication. Each node holds a local copy, which is the only thing SSO requests read.
_Avoid_: Cache, export, dump

**Publication**:
The act of producing a new Snapshot from the Console's database and making it the current one, which every node then fetches.
_Avoid_: Sync, deploy, flush

**Node**:
One running SimpleSAMLphp instance that serves SSO from its local copy of a Snapshot and shares nothing with the others but the database.
_Avoid_: Server, replica, instance

**Key reference**:
The pointer inside a managed entity or a managed authsource to a private key or a certificate. A private key is always a file that each node provides, never held by the Console; a certificate may instead be held by the Console itself.
_Avoid_: Key path, cert file

**Secret reference**:
A placeholder stored in place of a sensitive value, which each node replaces with the real value from its own environment when it builds its Snapshot.
_Avoid_: Vault key, env placeholder, secret path
