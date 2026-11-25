const TAIL = 16;

// In a list it keeps one line and loses its middle; on the object's own page it wraps and is never cut.
export function Eid({ id, wrap }: { id: string; wrap?: boolean }) {
  if (wrap) {
    return <span className="mono wrap-any">{id}</span>;
  }

  const cut = Math.max(0, id.length - TAIL);

  return (
    <span className="eid" title={id}>
      <span className="eid-a">{id.slice(0, cut)}</span>
      <span className="eid-b">{id.slice(cut)}</span>
    </span>
  );
}
