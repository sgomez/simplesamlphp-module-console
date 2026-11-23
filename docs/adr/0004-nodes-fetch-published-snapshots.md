# Nodes fetch published Snapshots instead of rebuilding them

A Publication stores the Snapshot in the database as one immutable, numbered JSON document carrying a format version and a checksum, and marks it as current. A node never reads the edit tables: it fetches the current Snapshot, resolves its Secret references and writes it to local disk, where a `MetadataStore` of the module serves it. Rebuilding from the edit tables on each node was the original idea; it breaks in a rolling deploy, where old code meets a new schema, and lets two nodes derive different results from the same version.

## Considered Options

- **Rebuild from the edit tables on each node**: rejected for the reasons above.
- **Core `serialize` layout on disk**: rejected; one file per entity has no notion of a whole set, so a switch passes through mixed states, and it has no place for authsources or for the Snapshot's own version and checksum.
- **Own polling command, run from the container entry point and a crontab**: rejected; running commands inside containers is a burden on the administrator, whereas an external scheduler calling the core `cron` URL is already common practice. Installing the module must take no more than editing configuration files.
- **Checking for a new Publication from ordinary requests**: rejected; SSO would depend on the database in normal operation.
- **Console pushes to nodes**: rejected; the Console would have to know the nodes. Reading the database during SSO to detect a new Publication is forbidden by the Snapshot rule.

## Consequences

- Rollback marks an earlier Snapshot as current. Nodes compare against the current one, never the highest number.
- On disk a Snapshot is a directory `<dir>/<n>/` of PHP files (`return [...]`, one per set and one for authsources) plus a `manifest.json`, with restrictive permissions because secrets are resolved. A `current` pointer is switched by atomic rename and read once per request. The current and previous versions are kept. With opcache, older versions hold memory until PHP restarts.
- Entities and authsources travel in the same Snapshot and are published and rolled back together.
- Running nodes learn of a Publication through the core `cron` module: a `CronEvent` listener checks for a newer current Snapshot on every tag, or only on the one named by the optional `cron_tag` option. The check is idempotent and reports its outcome in the `cron` summary. A call every minute is recommended. Behind a load balancer the scheduler must reach each node directly. The node serving the Publication request updates itself in that request, so a single-node deployment needs no `cron` at all. The module registers no commands.
- A node with no local Snapshot fetches the current one during its first request, under a local lock. This is the only case in which an SSO request reads the database. If none has been published, the node records that locally and asks no more; after a failed attempt it waits a short interval before trying again.
- The Snapshot table and the Node table are stable contracts: migrations only add columns, so any code version can read them. A node whose code is older than the current format keeps its local copy, or fails if it has none; it never falls back to an earlier Snapshot.
- An unresolvable Secret reference drops only the affected entity or authsource and is logged and recorded against the node.
- Each node records its identifier (hostname unless configured), served version, last check and unresolved Secret references in the database, and the Console shows which nodes lag.
- With the database down, a node keeps serving its local copy indefinitely.
