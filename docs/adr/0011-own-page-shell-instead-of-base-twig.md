# Own page shell instead of core's `base.twig`

Console pages are rendered by a shell template of the module that does not extend core's `base.twig`. It loads one module stylesheet and one module script, uses system font stacks, hard-codes `lang="en" dir="ltr"` and has no language selector. This departs from official SimpleSAMLphp modules, whose pages all extend `base.twig`; the Console follows their conventions for packaging, routing, controllers, the `Template` class, `asset()` and CSP compliance, but not for page chrome.

## Considered Options

- **Extend `base.twig` and override `header`, `contentwrapper` and `footer`**: rejected; it always loads core's stylesheet and script, wraps the content in core markup, and breaks under a theme whose `base.twig` drops those blocks.
- **Self-hosted Inter and JetBrains Mono**: rejected; binaries and licence files in the repository and a MIME type that depends on PHP's `fileinfo`, for a cosmetic gain in an administration tool.
- **Core's language selector in the sidebar**: rejected; the Console is English only, so the selector would change every other page and leave the Console as it was.
- **Sidebar links from `Menu::insert()`**: rejected; the class is `final` and undocumented, so it may change in a minor release.

## Consequences

- The Console renders the same under any installed theme, and passes core's default CSP: no inline scripts, no inline styles, no `style` attributes, nothing from another origin.
- The design boards' Google Fonts link goes, and their `style` attributes become classes.
- The shell sets its own `<title>`, favicon, `robots` and viewport lines.
- The deployer's `_head.twig` is not included.
- A `?language=` cookie set elsewhere on the site changes neither the language nor the direction of the Console.
- A theme can still override the Console's templates through `themes/<theme>/<module>/`; this is possible but not supported.
- The sidebar carries two fixed links to core: its admin front page and logout through `Utils\Auth::getAdminLogoutURL()`. Admin entries of other modules are not listed; they are one click away on core's page.
