# Managed authsources reach core through a hand-added fragment

SimpleSAMLphp 2.5 has no extension point for resolving authsource ids: everything reads `config/authsources.php` through `Configuration`. Managed authsources are in v1 anyway, merged into that file's result by a one-expression fragment the administrator adds by hand once. The fragment is a `class_exists()`-guarded static call into the module, so the logic ships and updates with the module and the fragment itself never changes.

## Considered Options

- **`Configuration::setPreLoadedConfig()` from a Composer `autoload.files` entry**: rejected; it needs no edit to the file, but it is invisible to the administrator, untested, and ignores `SIMPLESAMLPHP_CONFIG_DIR` by default.
- **Console writes the fragment itself**: rejected; the Console never writes hand-written configuration files.
- **No managed authsources (no-go)**: rejected; the fragment works without a core patch and its failure mode is bounded.
- **Core patch adding an extension point**: never an option for this module.

## Consequences

- The fragment is the last thing `authsources.php` executes, as `$config = X::merge($config);` or `return X::merge([...]);`. The module method catches every `\Throwable`, leaks no variables and merges with `+`, so a file authsource always wins over a managed authsource with the same id.
- An unreadable authsources section in the Snapshot is ignored as a whole with a warning; inside a readable one, structurally invalid entries are dropped one by one. Either way the file authsources keep working.
- The id `admin` is reserved for the file, so a broken Snapshot can never lock the administrator out. Ids that PHP casts to integer keys are rejected, and an id is immutable once created.
- The Console sees only the `authsources.php` of the node it runs on. A shadowed managed authsource is therefore a warning, not an error, and still travels in the Snapshot; each node settles the collision against its own file.
- The method records that it ran, which lets the Console report a node where the fragment is missing. Without it, managed authsources can be edited and published but have no effect.
