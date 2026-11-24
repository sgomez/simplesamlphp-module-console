# Console UI prototype

Throwaway. Never merged. Primary source for the ticket "Console UI structure".

- `brief/design-brief.md`: the brief given to the design tool.
- `brief/design-brief-import-and-php.md`: addendum. It supersedes the read-only "PHP" tab of the main brief.
- `design/`: export of the design canvas. `canvas.json` is the index (board titles and order); each `*.dc.html` is one board in the design tool's own component format, not a standalone page. `console.css` holds the tokens and component classes and is plain CSS.

The boards load fonts from Google Fonts and carry inline styles. Both are artefacts of the design tool; the module serves its own fonts and uses no inline styles.

Where a board contradicts a decision on the map, the map wins. Known cases are listed in the ticket's resolution.
