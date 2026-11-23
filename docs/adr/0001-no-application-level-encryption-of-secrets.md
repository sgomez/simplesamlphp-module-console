# No application-level encryption of secrets

Sensitive values in managed configuration (bind passwords, database passwords, key passphrases) are stored in the Console's database either as literals in clear, masked on read, or as Secret references (`%secret(name)%`, `%env(CONSOLE_NAME)%`) that each node resolves when it builds its Snapshot. The Console has no encryption key of its own: a key would travel through the same channel as the database credentials, so it only helps when the database leaks and the node does not, and it adds key distribution, rotation and the risk of losing every secret with the key. Protecting the database and its backups is left to the deployment; deployments that do not trust their database keep secrets out of it with Secret references.

## Considered Options

- **Key derived from `secretsalt`**: rejected. `secretsalt` also feeds persistent NameIDs, so it cannot be rotated in practice.
- **Dedicated Console key (AES-256-GCM)**: rejected for the reasons above.
- **References only, no literals**: rejected. Every secret change would need a redeploy of each node, which the Console exists to avoid.

## Consequences

- A leaked database or backup exposes every secret stored as a literal.
- A Secret reference is resolved per node, so a Publication cannot verify it on every node. A node missing the secret excludes the affected authsource or entity from its Snapshot and reports it.
- The Snapshot holds resolved values in clear, protected only by file permissions.
