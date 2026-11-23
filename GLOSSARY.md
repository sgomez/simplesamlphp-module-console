# Console

Administrative module for SimpleSAMLphp that manages SAML entities and authentication sources in a database instead of hand-edited PHP files.

## Language

**Console**:
The administrative interface and its database, where administrators edit managed configuration.
_Avoid_: Admin panel, dashboard, backoffice

**Managed entity**:
A SAML entity (`saml20-sp-remote`, `saml20-idp-remote` or `saml20-idp-hosted`) whose metadata is edited in the Console. It is identified by its entity ID together with its set, so the same entity ID may be a managed entity in more than one set.
_Avoid_: Record, metadata row

**External entity**:
A SAML entity in one of the managed sets that reaches SimpleSAMLphp from a metadata source other than the Console, whether written by hand or produced by `metarefresh`. The Console shows it but never edits it.
_Avoid_: Federated entity, remote entity, imported entity

**Managed authsource**:
An authentication source edited in the Console, as opposed to one declared by hand in `config/authsources.php`.
_Avoid_: DB source, dynamic source

**File authsource**:
An authentication source declared by hand in `config/authsources.php`. The Console lists it but never edits it.
_Avoid_: Static source, legacy source

**Authsource type**:
A kind of authentication source the Console knows how to edit. A managed authsource always has one; an authentication source of any other kind can only be a file authsource.
_Avoid_: Plugin, driver, provider

**Shadowed**:
Said of a managed authsource whose id is also a file authsource on a node, or of a managed entity that shares entity ID and set with an External entity whose source comes first on that node. The node serves the other one.
_Avoid_: Conflicting, hidden

**Override**:
A managed entity that shares entity ID and set with an External entity and is the one nodes serve. It no longer follows changes made in the external source.
_Avoid_: Fork, local copy, overridden

**Import**:
The act of creating managed entities from External entities, one or many at a time. The originals stay where they are, so an imported entity starts out as an Override or Shadowed.
_Avoid_: Migration, sync, takeover

**Snapshot**:
A complete, validated, numbered and immutable copy of all managed configuration, produced by a Publication. Each node holds a local copy, which is the only thing SSO requests read.
_Avoid_: Cache, export, dump

**Publication**:
The act of producing a new Snapshot from the Console's database and making it the current one, which every node then fetches.
_Avoid_: Sync, deploy, flush

**Pending change**:
A difference between what is saved in the Console and the current Snapshot: a managed entity or managed authsource that is new, modified, withdrawn or deleted and has not been through a Publication yet.
_Avoid_: Draft, unpublished edit, dirty record

**Rollback**:
The act of making a retained Snapshot other than the current one the current one. It changes what nodes serve and leaves what is saved in the Console untouched.
_Avoid_: Revert, restore, undo

**Node**:
One running SimpleSAMLphp instance that serves SSO from its local copy of a Snapshot and shares nothing with the others but the database.
_Avoid_: Server, replica, instance

**Key reference**:
The pointer inside a managed entity or a managed authsource to a private key or a certificate. A private key is always a file that each node provides, never held by the Console; a certificate may instead be held by the Console itself.
_Avoid_: Key path, cert file

**Secret reference**:
A placeholder stored in place of a sensitive value, which each node replaces with the real value from its own environment when it builds its Snapshot.
_Avoid_: Vault key, env placeholder, secret path

**Audit trail**:
The append-only record of every change of state made in the Console: who made it, when, and what the affected managed entity, managed authsource, Publication or schema looked like afterwards.
_Avoid_: Log, history, changelog
