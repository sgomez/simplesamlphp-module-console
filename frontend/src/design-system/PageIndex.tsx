export interface IndexEntry {
  // The id of the section on this page.
  target: string;
  label: string;
  note?: string;
  count: string;
}

// Links to the sections of the page, each with a note and a count.
export function PageIndex({ title, label, entries }: { title: string; label: string; entries: readonly IndexEntry[] }) {
  return (
    <nav className="page-index" aria-label={label}>
      <h2 className="nav-head">{title}</h2>
      {entries.map(({ target, label: text, note, count }) => (
        <a key={target} href={`#${target}`} className="crumb index-link">
          <span>{text}</span>
          {note && <span className="xs index-note">{note}</span>}
          <span className="xs faint index-count">{count}</span>
        </a>
      ))}
    </nav>
  );
}
