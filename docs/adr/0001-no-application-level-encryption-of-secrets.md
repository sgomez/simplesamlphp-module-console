# No application-level encryption of secrets

Sensitive values in managed configuration (bind passwords, database passwords, key passphrases) are stored in the Console's database either as literals in clear or as Secret references (`%secret(name)%`, `%env(CONSOLE_NAME)%`) that each node resolves when it builds its local copy of the Snapshot. The Console has no encryption key of its own: a key would travel through the same channel as the database credentials, so it only helps when the database leaks and the node does not, and it adds key distribution, rotation and the risk of losing every secret with the key. Protecting the database and its backups is left to the deployment; deployments that do not trust their database keep secrets out of it with Secret references.

## Considered Options

- **Key derived from `secretsalt`**: rejected. `secretsalt` also feeds persistent NameIDs, so it cannot be rotated in practice.
- **Dedicated Console key (AES-256-GCM)**: rejected for the reasons above.
- **References only, no literals**: rejected. Every secret change would need a redeploy of each node, which the Console exists to avoid.

## Consequences

- A leaked database or backup exposes every secret stored as a literal.
- A Secret reference is resolved per node, so a Publication cannot verify it on every node. A node missing the secret excludes the affected authsource or entity from its build and reports it.
- The Snapshot holds resolved values in clear, protected only by file permissions.
- A literal is sent back only to the edit form of the object that holds it, in a password field with a reveal control, on a page served with `Cache-Control: no-store`. Lists, Pending changes, the Audit trail, logs and `cron` summaries show a marker instead. Hiding it from the form too was dropped: with a single administrator role it stops nobody, since changing the target host and publishing delivers the secret anyway, and it forces the form to track which stored value an empty field keeps.
