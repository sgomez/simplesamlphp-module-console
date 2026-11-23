# Managed entity documents are open through an `extra` bag

A managed entity is stored as a Console document described by one JSON Schema per set, translated on the node into the array core expects, as managed authsources are. Unlike an Authsource type, the entity schemas are not closed: options the schema does not catalog go in an `extra` bag of free-form JSON that the translator merges into the final array. Entity metadata carries options from other modules (`consent.*`, whatever `SAMLParser` emits) that cannot be cataloged, and a closed schema would make the one-off import fail on real entities.

## Considered Options

- **Closed schema, as for authsources**: rejected; any entity using an uncataloged option would have to stay an External entity, and import would reject most real deployments.
- **Schema mirroring the core array with `additionalProperties: true`**: rejected; Key references, endpoints and localized strings need a document of their own, and unknown keys would sit next to cataloged ones with nothing marking them as unvalidated.
- **Dry-run through core classes at Publication**: rejected; core has no validator, options are checked by whichever consumer reads them, and a dry-run covers only the path it exercises.

## Consequences

- Whatever is in `extra` is neither validated nor masked on read. The cataloged sensitive options are `sharedkey`, `privatekey_pass` and `new_privatekey_pass`.
- `extra` may not contain a cataloged key, so it cannot bypass masking, Key references or the `authproc` rules. It accepts no Secret references, and `expire` is rejected in it.
- The Console warns about every managed entity that uses `extra`.
- The catalog covers the options listed in the SimpleSAMLphp 2.5 reference for each set; options owned by other modules are never cataloged.
