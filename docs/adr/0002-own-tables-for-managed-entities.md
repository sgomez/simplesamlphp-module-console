# Own tables for managed entities

The Console stores managed entities in tables of its own and never reads or writes the core PDO metadata handler tables outside the one-off import. The core tables are what the core `pdo` source serves live, so writing there would put every save into production without a Publication; their `entity_id` + `entity_data` shape has no room for an enabled flag, timestamps or history; and `metarefresh` can write into them, which would mix federated entities with managed ones and let a refresh overwrite a managed entity.

## Considered Options

- **Reuse the core PDO tables**: rejected for the reasons above. Since SSO reads only the Snapshot, sharing the tables with the core `pdo` source buys nothing.
- **Refuse to run while `pdo` is in `metadata.sources`**: rejected. It would force sites using `metarefresh` with `pdo` output to reconfigure it before installing the Console.

## Consequences

- The core PDO tables are an external source, like flat files: the Console does not modify them and does not empty them after an import.
- A site that keeps `pdo` in `metadata.sources` loses the guarantee that SSO survives a database outage, because the `pdo` source's constructor throws and breaks every metadata operation. The Console cannot prevent this; it warns on its status screen and on the command line.
- After an import, the same entity exists in both places until the administrator removes `pdo`. If `pdo` comes before the Console in `metadata.sources`, published changes to those entities have no effect; the Console warns about the shadowed entities.
- Sites already using the core tables must import.
