# Authsource forms rendered by Twig from the schema, with one hand-written script

The edit form of a managed authsource is generated on the server from the JSON Schema of its Authsource type: PHP resolves `$ref`, turns the submitted strings into a document guided by the schema, and builds a tree that Twig renders. A throwaway prototype over `ldap:Ldap`, `sqlauth:SQL2` and `exampleauth:UserPass` showed that nested objects, lists inside lists, conditional options and errors shown in place need no client-side bundle. JavaScript is required, but it is one static, hand-written file with no dependencies and no build step; it validates nothing and knows no schema, acting only on `data-` attributes (show or hide a field, add, remove and move list rows, reveal a secret). Core's default `Content-Security-Policy` (`script-src 'self'; style-src 'self'`) rules out inline scripts and styles.

Presentation is driven by the schema:

- Order is the declaration order of `properties`.
- `x-groups` at the root lists `{title, properties}`; every root property belongs to exactly one group.
- The widget follows from the type. `x-widget` allows only `textarea` and `radio`.
- `x-when` on a property names a sibling and the values for which the property applies. A property that does not apply is hidden and dropped on save. `if`/`then` keeps expressing what is required.
- The first `examples` entry, or `default`, is shown as a hint. `default` is never written into the document (`allowDefaults` is off in `opis/json-schema`), so an absent option gets its value from the SimpleSAMLphp module on the node.

## Considered Options

- **Client-side form library or SPA with a bundle**: rejected; nothing in the prototype needed it, and it brings a build step and a second validation path.
- **Working without JavaScript**: rejected; it works, but list editing through page reloads is clumsy and every interaction would need testing twice.
- **Deriving visibility from `if`/`then`**: rejected; it only covers properties a branch makes required, not optional ones that apply under the same condition.
- **Letting the validator fill in `default`**: rejected; it freezes defaults at save time and makes a managed authsource differ from the same one written by hand.

## Consequences

- `x-when` repeats part of `if`/`then`. The test suite checks that every property a branch requires carries a compatible `x-when`, that every root property is grouped, and that every `pattern` has its own message.
- Error texts are generic per keyword and written in the module; a `pattern` carries its own text through `$error`; cross-field rules word their own. The Console is English only in v1.
- A select whose values come from the same document (a query's database in `sqlauth:SQL2`) is a plain text field checked on save. Fields annotated `x-authsource-reference` are rendered as a server-built select.
- Language maps are lists of language and text rows, `authproc` is a JSON text area, and a Key reference has its own control. None of these was prototyped, and neither was a schema as large as `saml:SP`.
- The script has no type checking and is covered only by browser tests. If it grows well beyond a hundred lines, a bundle becomes a new decision.
