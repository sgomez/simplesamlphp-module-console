# Console UI as a single-page application in React and TypeScript

The Console UI is a single-page application written in React and TypeScript and built with Vite. One page shell serves it on every Console path. Every screen gets its data from, and sends its requests to, a JSON API of the module that is a new client of `src/Application`. `src/Domain` and `src/Application` do not change, and the server stays authoritative for validation, translation and Publication. This supersedes [ADR 0007](0007-authsource-forms-rendered-by-twig-from-the-schema.md) and [ADR 0011](0011-own-page-shell-instead-of-base-twig.md), and amends [ADR 0010](0010-php-view-through-inverse-translators.md).

ADR 0007 said a bundle becomes a new decision "when the script would need to know the schema or validate". That is now the case:

- **The Milestone 1 UI departed from `prototype/console-ui`.** Nothing forced the templates to follow the boards, so they drifted from them.
- **The schema-driven form is stateful UI.** Adding and unsetting root options, `x-when`, group counts, list rows, the option finder, and the key slot and certificate controls make up the core of the product. ADR 0007 estimated 300 to 400 lines of untyped, untested script for them.
- **The Settings/PHP switch is client state over one document, and live validation has to read the schemas.**
- **Reuse can be enforced.** ESLint fails CI on a raw `<button>`, `<input>`, `<select>`, `<textarea>` or `<dialog>` outside the design system. Twig has no equivalent, and `templates/` has no macros.
- **Components are typed.** TypeScript props fail at compile time, whereas a mistake in a Twig macro argument shows up only at render time.
- **Switching is cheap now.** The Milestone 1 templates total about 330 lines.

## Page shell

The shell is one Twig template, rendered through core's `Template` class for every Console path that is not under `api/` or `assets/`. It runs `requireAdmin()`, so an unauthenticated load goes to core's login. It does not extend `base.twig`, for the reasons ADR 0011 gave, which still hold:

- `base.twig` always loads core's stylesheet and script, and it breaks under themes that drop its blocks;
- `lang="en" dir="ltr"` is hard-coded;
- the shell sets its own title, favicon, `robots` and viewport;
- there is no `_head.twig` and no language selector;
- the two fixed links to core are kept.

The shell contains no chrome. It references the entry script and its stylesheet as resolved from Vite's manifest, and it carries the request-forgery token in a `<meta>` element. The sidebar and every screen are React.

## API

- **Location.** Routes live under `module.php/console/api/`, declared in `routing/routes/` and served by autowired controllers.
- **Methods.** Reads are GET. Every state-changing request is a POST with a JSON body, and every non-mutating POST (translate, validate, Reveal, reading pasted configuration) is one too, so "no GET changes state" still holds.
- **Gate.** The checks run in this order: admin, then database state, then the token.
  - A missing admin session gives 401, never a redirect.
  - A database that is not ready gives 503 with its state, and the SPA renders the state page.
  - A POST must carry the session token in an `X-Console-Token` header and `Content-Type: application/json`. Anything else gives 403 or 415. A cross-site form cannot set either.
- **Results.** A success returns the new state. The SPA navigates and shows the one-shot message itself, so the post/redirect/get cycle and the session flash message go. Errors are JSON with the same JSON pointers, lines and texts as before.
- **Caching.** Responses that carry a sensitive value are `Cache-Control: no-store` ([ADR 0001](0001-no-application-level-encryption-of-secrets.md)). The client keeps them in memory only, never in Web Storage.
- **Entity IDs** travel in the query string or the body, never in the path.

## Front end

- **Location.** The sources live in `frontend/`.
- **The board wins.** The boards of `prototype/console-ui` decide layout, wording and components, light and dark. When a board and `SPEC.md` disagree, `SPEC.md` is changed to match the board. A screen or state with no board, or a board that needs a capability the product lacks, is decided by the maintainer before it is built.
- **Layers.** `frontend/src/` is organised as `tokens → design-system → domain → pages → app` ([FSD Lite](https://gist.github.com/sgomez/b51eab2a95c84bf66949e2d1ff570b80)), with a small `lib/` beside `tokens` for helpers with no business meaning. A layer imports only from layers to its left.
  - `tokens` are the custom properties of `console.css`, as the prototype defines them.
  - `design-system` holds the primitives and knows no business term. Only it renders native form, link and dialog elements.
  - `domain` holds one slice per area of the glossary (`database`, `session`, `entities`, `publication`, `documents`). A slice owns its components, state and use cases, and reaches the server only through its ports. Slices import each other without cycles and only through their `index.ts`.
  - `pages` compose slices and primitives for one route and hold no logic.
  - `app` holds the entry, the router, the providers and the adapters that implement the ports: HTTP in production, in memory for stories and tests.
  - `eslint-plugin-boundaries` enforces these rules in CI.
- **Primitives on React Aria.** Primitives with behaviour build on `react-aria-components`, so keyboard use, focus, ARIA and press handling come from a library tested with real assistive technology rather than from our code. Primitives without behaviour are plain markup.
- **Styling.** Styles come from one stylesheet: the prototype's `console.css`, with layout classes for what the boards write inline and `[data-…]` selectors for the states React Aria exposes, with the same values as the class selectors they mirror. It is linked as a file, never imported into a component. There are no CSS modules, no CSS-in-JS and no `style` prop. React Aria sets positioning and visually-hidden styles through the CSSOM, which core's CSP allows because the client renders every page.
- **Tokens and fonts.** No colour, size or font is written outside the token definitions, and fonts are system stacks, whatever a board names.
- **Storybook.** Every primitive, domain component and page has stories next to it, rendered over the in-memory adapters. Tokens appear as Foundations docs generated from the custom properties of `console.css`, light and dark. Storybook is the review surface: every state of every page has its own URL, with no backend.
- **Tests on the stories.** Every story runs as a Vitest browser test in Playwright's Chromium (`@storybook/addon-vitest`) with an axe check that fails on any violation. Interactive stories have `play` functions for keyboard and focus. Domain logic keeps jsdom unit tests.
- **Visual regression.** Page stories, and only page stories, are compared with Vitest's `toMatchScreenshot`, light and dark, at desktop width and at 400 px. Reference screenshots are committed. The browser runs in the official Playwright Docker image, pinned by digest, locally and in CI, so fonts and rendering are the same everywhere. A CI job fails when a pull request changes reference screenshots without the `visual-change` label, which only the maintainer applies.
- **Dependencies.** The npm set is pinned exactly:
  - at runtime: React, React DOM, a router and `react-aria-components`;
  - at build and test time: Vite with its React plugin, TypeScript, ESLint with its TypeScript, React and boundaries plugins, Vitest with Testing Library, jsdom and browser mode on Playwright, Storybook with its Vitest, accessibility and docs addons, Ajv, and a JSON-Schema-to-TypeScript generator.

## Build and development

**Build.** `composer build` runs `npm ci --ignore-scripts` and `vite build`. The hashed files and `.vite/manifest.json` land in `public/assets/app/`, which is committed and shipped in the Composer package. `frontend/`, `package.json`, `package-lock.json` and the configs are `export-ignore`, so installing the module needs no Node. The Node and PHP versions are pinned in `mise.toml`. CI rebuilds and fails on any difference from the committed output.

**Development.** `composer dev` starts the `dev` Docker profile with a Vite service in front of it. The browser opens the Console on Vite's port, and Vite proxies `/simplesaml/` to the SimpleSAMLphp container with the original `Host` header. The dev configuration of that node uses a host-relative `baseurlpath` and sets the module key `dev_server`. With that key set, the shell references:

- Vite's client;
- a module that installs React Fast Refresh;
- the entry module;
- the stylesheet.

All of these are same-origin paths in place of the manifest. Page, scripts, API and the HMR websocket share one origin, so core's default CSP and the admin session cookie work unchanged. Editing `console.css` reloads the stylesheet instead of injecting a `<style>` element.

## Validation

Both sides read the same files in `docs/spec/schemas`.

- **Client.** At build time the schemas are compiled with Ajv's 2020-12 build into standalone validator modules. The client never compiles a schema at runtime, because Ajv's runtime compilation uses `new Function`, which `script-src 'self'` forbids. Ajv is a build-time dependency: only the compiled validators and a small runtime of the module ship, and nothing of Ajv itself.
  - The `format` rules the schemas use are implemented in the client to match opis, so that both sides accept the same values.
  - `$error` and `x-when` are declared once as Ajv keywords. `$error` supplies the message of a failed `pattern`; `x-when` is read by the form engine. Defaults are never applied.
  - TypeScript types for the documents are generated from the same schemas.
  - The client's per-keyword error texts are the module's texts. A shared fixture suite checks that Ajv and opis agree on the verdict, the pointer and the message.
- **Server.** opis stays authoritative on save and again at Publication.
- **Cross-field rules.** No cross-field rule moves to the schema in this change, because they live in `src/Domain`. The client gets them from `POST api/{kind}/validate`, debounced while editing, which runs the full server validation and saves nothing. This covers:
  - the rules of `SpRemoteRules`, `RowRules`, `ExtraRules`, `NotYetRules` and `EntityIdRules`;
  - the identifier checks of the PHP block;
  - inverse-translation errors and warnings.
- **Later candidates.** Some rules fit 2020-12 and could move into the schema later, by a decision of their own: one `isDefault` per service (`maxContains`), no Secret reference in `extra`, the reserved `extra` names, the `core:PHP` ban and the not-yet-supported options.
- **PHP.** PHP is never parsed in the browser. The PHP view, Reveal and the view switch are API calls.

## Considered Options

- **Keep Twig with one hand-written script**: rejected; the reasons above.
- **React islands over Twig pages**: rejected; the design system would be implemented twice, once in Twig and once in React.
- **Symfony UX TwigComponent and LiveComponent**: rejected; they are bundles that need the Symfony kernel, which a SimpleSAMLphp module does not have.
- **API Platform**: rejected; it needs the same kernel, and the domain is commands (publish, an optimistic save, PHP text), not CRUD.
- **Module emitting Vite client tags that point to another origin in development**: rejected; it needs a development-only CSP that allows the Vite origin and its websocket, so development would not run under the policy production enforces.
- **Ajv compiling schemas in the browser**: rejected; it needs `'unsafe-eval'`.
- **Porting the PHP cross-field rules to TypeScript**: rejected; it would be a second implementation of every rule.
- **Hand-written primitives**: rejected; keyboard, focus and ARIA behaviour are hard to get right and costly to test, and React Aria ships them tested.
- **Radix**: rejected; fewer form components, and one package per primitive.
- **Component-scoped styles or CSS modules**: rejected; one stylesheet, the prototype's, is what keeps the UI faithful to the boards.
- **dependency-cruiser**: rejected; ESLint already runs in CI, and `eslint-plugin-boundaries` enforces the layers there.
- **Code snapshots** (`toMatchSnapshot` of rendered HTML): rejected; they do not see `console.css`, break on any markup change and get updated without review.
- **Hosted visual review** (Chromatic, Percy, Applitools, Lost Pixel's platform): rejected; no proprietary software is used and nothing is sent to an external service.
- **Playwright Test `toHaveScreenshot`**: not chosen; more mature, but a second test runner next to Vitest. It is the fallback if Vitest's comparison proves unstable.

## Consequences

- **New security surface.** The JSON API is new attack surface. Every API route goes through the gate, and the request forgery walk covers every API POST.
- **Two test stacks.** The HTTP tests that asserted Twig HTML become API tests that assert status, JSON and headers. Front-end code gets Vitest tests in jsdom and in a real browser.
- **CI.** CI gains a front-end job: lint, type check, tests in jsdom and in the browser, build-and-compare, generated types up to date, and a package-contents check. A visual job runs the page screenshots in the Playwright image, and a gate job checks the `visual-change` label. Dependabot gains the `npm` ecosystem, and CodeQL gains `javascript-typescript`.
- **Screenshots are reviewed by a person.** A pull request that changes the look of a page waits for the maintainer, who compares it with its board in Storybook before applying the label.
- **React Aria's pressable style.** `usePress` adds a `<style>` element for `touch-action` unless an element with the id `react-aria-pressable-style` exists. Core's CSP would block that element, so the shell's stylesheet link carries that id and `console.css` holds the rule.
- **Node** is a development and CI dependency, never an installation one.
- **The semantics of ADR 0007 survive in the client's form engine, specified in SPEC section 10.10.** Only set root options are shown, presence is the existence of the key, `x-groups`, `x-when`, the `x-widget` allowlist, booleans starting opposite their `default`, `default` never written, and `extra` alone in the last group.
- **ADR 0010 holds**, except that switching views and Reveal are API calls instead of form round trips. The client now knows the schema, but it still never parses PHP.
- **Theme overrides end.** A theme can no longer override a Console screen, since only the shell remains a template.
- **The schemas must ship.** `docs/spec/schemas` has to be in the installed package, because the server reads them at runtime.
