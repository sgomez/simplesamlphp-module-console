# Console

Administrative module for SimpleSAMLphp that manages SAML entities and authentication sources in a database instead of hand-edited PHP files.

## Language

**Console**:
The administrative interface and its database, where administrators edit managed configuration.
_Avoid_: Admin panel, dashboard, backoffice

**Managed entity**:
A SAML entity (`saml20-sp-remote`, `saml20-idp-remote` or `saml20-idp-hosted`) whose metadata is edited in the Console.
_Avoid_: Record, metadata row

**Managed authsource**:
An authentication source edited in the Console, as opposed to one declared by hand in `config/authsources.php`.
_Avoid_: DB source, dynamic source

**Snapshot**:
A complete, validated, node-local copy of all managed configuration, which is the only thing SSO requests read.
_Avoid_: Cache, export, dump

**Publication**:
The act of producing a new Snapshot from the Console's database and making it reach every node.
_Avoid_: Sync, deploy, flush

**Key reference**:
The pointer inside a managed entity to its private key or certificate, which may resolve to a file or to the database.
_Avoid_: Key path, cert file
