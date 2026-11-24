# Editable PHP view through inverse translators

The edit screen of a managed entity or a managed authsource has two views of the same object: the form and the PHP array an administrator would write in the file (`$metadata['…'] = […];` or `'id' => […],`). The stored document stays the Console document validated by its JSON Schema, so every entity set and every Authsource type carries a second, inverse translator from the array core expects back to the document. The same PHP is the Console's rendering of an object everywhere else: the Publish, Rollback and Audit trail diffs.

The text is read with `nikic/php-parser` and an allowlist walk of the AST, never executed, and written with `VarExporter::export`; both already ship with SimpleSAMLphp 2.5.

## Considered Options

- **Read-only PHP tab**: rejected; administrators who work in text would still have to retype every change into the form, and pasting a block from a file would not be possible.
- **Editable for entities, read-only for authsources**: rejected; it saves the five authsource inverse translators at the price of two kinds of edit screen.
- **Showing the Console document instead of the core array**: rejected; it is not the file the administrator knows and cannot be copied to or pasted from one.
- **Storing the PHP text**: rejected; it would be a second source of truth beside the document.

## Consequences

- Each schema has two translators, and the test suite checks that document to PHP to document is the identity.
- The text comes back normalised on every save: keys in schema order, comments dropped. A dismissible notice says so.
- Accepted input is one block, with its wrapper or as a bare array, made of literals plus `SAML2\Constants::*` from a fixed list, which are written back as literals.
- A block whose entity ID, authsource id or type differs from the object's is rejected.
- An uncataloged key goes to `extra` for an entity, with a non-blocking warning and a suggestion when it is close to a cataloged option; for an authsource it is an error.
- A stored sensitive literal is shown as a fixed sentinel tied to its option; saving the sentinel keeps the stored value, and anywhere else it is an error. Reveal replaces the sentinels with the real values. Secret references are plain strings and always visible. Diffs show the marker.
- The Console translates with Secret references unresolved, so its PHP is not byte for byte what a node serves; nodes still resolve first and translate afterwards.
- Unreadable text (syntax error, non-literal value) blocks saving, Reveal and the switch to the form, with line and column. Rule errors are tied to the line of the root option they come from.
- Switching views and Reveal are server round trips that save nothing; the script still knows no schema.
- A document the current translator cannot translate, such as an old Audit trail entry after a module update, is shown as raw JSON.
- An External entity is already a core array and is rendered with `VarExporter::export` directly.
- No side-by-side layout and no syntax colouring in v1.
