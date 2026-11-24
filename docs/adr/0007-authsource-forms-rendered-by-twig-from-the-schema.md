# Edit forms rendered by Twig from the schema, showing only the options that are set

The edit form of a managed authsource or a managed entity is generated on the server from its JSON Schema: PHP resolves `$ref`, turns the submitted strings into a document guided by the schema, and builds a tree that Twig renders. A throwaway prototype over `ldap:Ldap`, `sqlauth:SQL2` and `exampleauth:UserPass` showed that nested objects, lists inside lists, conditional options and errors shown in place need no client-side bundle. JavaScript is required, but it is one static, hand-written file with no dependencies and no build step; it validates nothing and knows no schema, acting only on `data-` attributes. Core's default `Content-Security-Policy` (`script-src 'self'; style-src 'self'`) rules out inline scripts and styles.

The form shows only the root options that are set, meaning their key exists in the document. A first prototype that printed all 64 options of `saml:SP` was rejected as more work than editing the PHP file. The server still builds the whole tree; an option that is not set is sent as an inert `<template>` that the script activates when the administrator adds it, from a button under its group or from the option finder.

## Set and not set

- Presence is submitted apart from the value, as one marker per root option, and is never inferred from the value. A set option left empty, switched off or with no rows is saved as such and judged by the schema.
- Unsetting an option removes its key on save. Options in the root `required` list are always shown and cannot be unset; a new object shows only those.
- The rule applies to root options only. A nested object or a list row renders all its fields, and there an empty optional field means absent.
- A newly added boolean starts at the opposite of its `default`. Anything else starts empty, an `enum` with no selection, with the `default` shown as a hint.
- `default` is never written into the document (`allowDefaults` is off in `opis/json-schema`), so an option that is not set gets its value from the SimpleSAMLphp module on the node.

## Presentation driven by the schema

- Order is the declaration order of `properties`.
- `x-groups` at the root lists `{title, properties}`; every root property belongs to exactly one group. A group states how many of its options are set out of those that currently apply.
- The widget follows from the type. `x-widget` allows only `textarea`, `radio`, `suggest`, `certificate`, `key-slot` and `certificates`.
- `x-when` on a property names a sibling and the values for which the property applies. `if`/`then` keeps expressing what is required.
  - An option that a branch makes required appears on its own and cannot be unset.
  - An optional one that starts to apply is only offered as an add button.
  - One that does not apply is not offered under its group; the finder lists it disabled, with the reason. If it was set, it is hidden and dropped on save.
- The first `examples` entry, or `default`, is shown as a hint.
- The three managed entity schemas carry the same annotations. `extra` is one more option, alone in a last group "Uncataloged options", edited as a JSON text area. The finder offers no shortcut into it.

## Considered Options

- **Client-side form library or SPA with a bundle**: rejected; nothing in the prototype needed it, and it brings a build step and a second validation path.
- **Working without JavaScript**: rejected; it works, but list editing through page reloads is clumsy and every interaction would need testing twice.
- **Rendering every option of every group**: rejected; unusable for `saml:SP`, where a typical object sets 8 to 15 options of about 64.
- **Inferring presence from the value**: rejected; an empty text, a switch that is off and a list with no rows cannot be told from an option that is not set.
- **Fetching the fields of an added option from the server**: rejected; it needs a fragment endpoint or a reload with unsaved edits.
- **Applying "only what is set" inside nested objects and list rows**: rejected; rows hold four or five fields, and add and unset controls per row cost more than they save.
- **Sending an uncataloged option name from the finder to `extra`**: rejected; a mistyped cataloged option would land there unvalidated.
- **Deriving visibility from `if`/`then`**: rejected; it only covers properties a branch makes required, not optional ones that apply under the same condition.
- **Letting the validator fill in `default`**: rejected; it freezes defaults at save time and makes a managed authsource differ from the same one written by hand.

## Consequences

- "Empty" has two meanings: set and empty at the root, absent inside a nested object or list row.
- `x-when` repeats part of `if`/`then`. The test suite checks that every property a branch requires carries a compatible `x-when`, that every root property is grouped, and that every `pattern` has its own message.
- Error texts are generic per keyword and written in the module; a `pattern` carries its own text through `$error`; cross-field rules word their own. The Console is English only in v1.
- A select whose values come from the same document (a query's database in `sqlauth:SQL2`) is a plain text field checked on save. Fields annotated `x-authsource-reference` are rendered as a server-built select.
- Language maps are lists of language and text rows, `authproc` is a JSON text area, and a key slot has its own control. None of these was prototyped.
- The script adds, unsets and finds options, keeps the group counts, shows or hides conditional options, edits list rows and reveals secrets: an estimated 300 to 400 lines. It has no type checking and no browser tests cover it in v1. A bundle becomes a new decision when the script would need to know the schema or validate, not at a line count.
