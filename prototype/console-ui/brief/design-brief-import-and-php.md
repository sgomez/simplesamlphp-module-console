# Design brief, addendum: bringing configuration in, and editing as PHP

This extends `console-ui-design-brief.md`. Same constraints, same design system, same vocabulary. It adds two things to the Console: more ways to create an object from configuration that already exists, and an advanced mode where the administrator edits the object as the PHP array they already know.

## The idea

The Console is an editor for SimpleSAMLphp's PHP arrays, with validation, history and publishing around it. The form is one way to edit an object; the PHP is the other. Both are always available, both edit the same object, and an administrator can live entirely in either.

## Why

Administrators rarely start from nothing. They have one of these in hand:

- the metadata XML a service publishes, as a file, as text or at a URL;
- a PHP array, from their own `saml20-sp-remote.php` or `authsources.php`, or pasted from a vendor's documentation, which is nearly always written as PHP;
- an object exported from another Console installation.

Retyping any of them into a form is exactly the work the Console exists to remove. And many administrators are faster in text than in a form: they must be able to stay in PHP without giving up the Console's validation, history and publishing.

## How it works underneath (so the design does not promise the wrong thing)

- What the administrator types as PHP is **read, never executed**. The Console parses it as data.
- Only **literal values** are understood: arrays, strings, numbers, booleans, `null`, and a closed list of well-known constants (the SAML binding and NameID format constants people paste from documentation). Anything else, a function call, a variable, a concatenation, an unknown constant, is rejected with its line and a plain explanation.
- What is typed is **normalised on save**: it comes back consistently formatted, in a canonical key order, and **comments are not kept**. The design must say this before the first save, not after.
- Internally the object is stored as a structured document, validated against a schema. The administrator never needs to see that format; it only surfaces as an export file.
- A few things about an object are **not part of the PHP array** and stay outside the text: whether it is enabled, and its place in the publish cycle. They live in the page around the editor.
- Secrets appear in the PHP as written: a literal, or a Secret reference such as `'%secret(name)%'`. Key and certificate files appear as their path.

## Part 1: create from existing configuration

Applies to "Add service provider", "Add identity provider", "Add hosted IdP" and "Add authsource".

### One entry screen, several sources

A single "Add" screen where the administrator picks how to start. The common case should need one paste and one click:

- **Paste** (default): one large text area that accepts metadata XML, a PHP array or a Console export. The Console detects which it is; the design shows what it detected ("Looks like SAML metadata", "Looks like a PHP array") and lets the administrator correct it.
- **Upload a file**: the same three formats.
- **Fetch from a URL**: metadata XML only. A one-off download at creation time; state plainly that the Console will not follow later changes at that URL.
- **Start empty**, in the form or in PHP.
- A cross-link to **External entities** for what SimpleSAMLphp already serves from files or federation feeds.

For authsources, metadata XML does not apply; paste accepts a PHP array or a Console export. The authsource type is read from the array (its first element, such as `'saml:SP'`); when it is not one of the five supported types, say so and stop there.

### The review step

Nothing is saved from a paste without review. Between the paste and the editor sits one screen, or one clearly separate state of the editor, that answers "what did you understand?":

- **Understood**: the options that were recognised.
- **Converted**: values that changed shape on the way in (a single endpoint URL became an endpoint list, a certificate file became pasted PEM, a plain string became a per-language map).
- **Kept as extra**: options the Console does not catalogue, carried along untouched.
- **Needs you**: what could not be read (an expression in the PHP, a private key that must become a file reference, a secret found in clear text with the suggestion to turn it into a Secret reference).
- **Ignored**: what was dropped and why (`expire`, XML extensions the Console does not support, comments).

Then the editor opens pre-filled, in whichever view the administrator prefers, with the "needs you" items flagged like validation errors.

### When the input holds several entities

A metadata file can contain many entities, and a pasted `saml20-sp-remote.php` usually does.

- Show them as a selectable list: name, entity ID, whether one with the same entity ID is already managed (not selectable) or exists as an External entity (will become an Override).
- Creating several at once uses the Import result pattern from the main brief: created, skipped with the reason, conversions applied.
- One entity selected goes to the review step and the editor; several go straight to the result page and land as changes to publish.

### States to design

- Empty paste area, with one short example of each accepted format.
- Detected format, with a way to override the detection.
- Unreadable input: where it broke (line and column), in plain words.
- PHP that parses but contains something that is not a literal: the line, what it is, what to write instead.
- Valid XML that describes a different kind of entity than the one being added (an IdP's metadata pasted under "Add service provider"): offer to switch.
- URL fetch: in progress, failed (unreachable, not XML, too large), succeeded.
- Review with nothing to flag; review with "needs you" items.
- Several entities found.

## Part 2: advanced mode, editing as PHP

### Two views of one object

Every edit screen has a two-way switch:

- **Settings**: the form from the main brief.
- **PHP**: the same object as an editable PHP array.

This replaces the read-only "PHP" tab described in the main brief. PHP is a full editing mode with the same validation on save, the same save bar and the same place in the publish cycle. Switching views never loses edits. The Console remembers which view the administrator last used and opens the next object in it.

On wide screens, consider offering both side by side: form on the left, PHP on the right, each reflecting the other after a save. Show it as an option if it holds up; do not force it.

### The PHP editor

Within the technical constraints (one hand-written script, no dependencies, no bundler), this is an enhanced text area, not an embedded code editor. Design for that honestly and make it good:

- Monospace, line numbers, sensible tab and indentation handling, generous height, syntax colouring if it can be done without a library (otherwise none: do not fake it).
- The text shown is exactly what would sit inside the file: for an entity, `$metadata['https://…'] = [ … ];`; for an authsource, `'id' => [ 'saml:SP', … ],`. An administrator can copy it into a file, or paste a block from a file over it, with no adjusting.
- **Validation on save**, on the server, in two layers the design must tell apart:
  - *Could not read it*: a syntax error or a non-literal value, with line and column. Nothing else is checked until this is fixed.
  - *Read it, but it is wrong*: the same errors the form would show (unknown value, missing required option, malformed URL), each tied to the line of the option it concerns.
  Errors are listed above the editor and marked in the gutter; with the script available, clicking one moves the cursor there.
- **Warnings** (expired certificate, SHA-1, plain http endpoint) are shown the same way, visibly different from errors, and never block.
- After a save the text comes back normalised. The first time this happens, a short, dismissible notice explains that formatting was tidied and comments are not kept.
- **Options the Console does not catalogue** are accepted and kept (they are the "extra" options of the form). Mark them quietly so a typo in an option name is noticeable: an unrecognised key should look different from a known one, with "did you mean…?" when it is close to a known option.
- **Sensitive values** are visible in the editor, as they are in the form's own fields behind a reveal control. Decide and show how the PHP view opens: with secrets masked until revealed, or in clear with a notice. Elsewhere in the Console (Publish, History) they never appear.
- A **reference panel** beside the editor: the options available for this kind of object, with their names, types, allowed values and defaults, searchable. It is the equivalent of the form's "find an option" for people working in text. Choosing an option inserts it at the cursor with its default.
- **Copy**, and **Download** as a `.php` fragment or as a Console export for moving an object to another installation.

### What stays outside the text

A compact strip above or beside the editor, identical in both views, holds what is not in the array:

- enabled or disabled;
- status in the publish cycle and the save bar;
- contextual notices (Override, source changed, Shadowed);
- secondary actions (discard changes, delete).

### Switching views

- Settings to PHP always works: the PHP is generated from the current state of the form, unsaved edits included.
- PHP to Settings works when the text can be read. If it has a syntax error or a non-literal value, the switch is blocked with the error shown; the administrator fixes it or discards the text edits.
- If the PHP reads fine but breaks the rules, Settings opens with those errors on the matching fields.
- An option written in PHP that the form does not catalogue shows up in the form's "Extra options" group.

### Paste over an existing object

The PHP view also covers "replace this object with what I have here": selecting everything and pasting a block from a file. Because that is easy to do by accident, saving a change that removes many options shows the diff first.

"Replace from…" offers the same sources as Part 1 (XML, PHP, export, URL) for an existing object, followed by the same review step, shown as a PHP diff against the current object before anything is saved.

### PHP everywhere else

The same rendering is the Console's common language for showing an object:

- the Publish screen's diffs are PHP diffs;
- the detail of an External entity is shown as PHP;
- consider the same for Rollback and Audit trail diffs, for consistency.

### States to design

- PHP view: clean, edited, syntax error, non-literal value, rule errors, warnings only, saved and normalised (with the first-time notice).
- An unrecognised option with a "did you mean…?" suggestion.
- The blocked switch to Settings.
- The reference panel: browsing, searching, an option already present.
- The strip of out-of-text state in both views.
- A save that removes many options, with its diff.
- "Replace from…" review as a diff.
- Side by side, if offered.
- Narrow width: the reference panel collapses under a button.

## Usability notes specific to this addendum

- **One object, two views.** Never let Settings and PHP look like two different objects or two different save actions.
- **It is their file, improved.** The PHP view should feel like the file the administrator already edits, plus line-accurate errors, a reference at hand and a review before going live.
- **Be upfront about the limits.** Literals only, comments not kept, formatting normalised. Say it where it matters, once, in plain words.
- **Say what happened to the input.** People distrust converters. The review step and the normalisation notice are what earn the trust: show every conversion and every omission, never silently fix.
- **Text people stay in text.** In PHP view everything needed (reference, errors, save, publish) is reachable without touching the form.
- **Paste is the fast path.** From the list page to a saved object should be: one click, one paste, one review, one save.
- **No dead ends.** Every "could not read this" names the line, explains why and says what to write instead.

## Deliverables added by this addendum

1. The "Add" entry screen, for an entity and for an authsource.
2. The review step, in its clean and its "needs you" variants, and the several-entities list.
3. The two-way view switch on the edit screen, with the PHP editor, its reference panel and the strip of out-of-text state.
4. The two layers of errors in the PHP view, the blocked switch, and the normalisation notice.
5. "Replace from…" with its PHP diff.
6. The side-by-side layout, if it holds up.
