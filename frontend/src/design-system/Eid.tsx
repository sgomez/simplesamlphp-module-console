const TAIL = 16;

export function Eid({ id }: { id: string }) {
  const cut = Math.max(0, id.length - TAIL);

  return (
    <span className="eid" title={id}>
      <span className="eid-a">{id.slice(0, cut)}</span>
      <span className="eid-b">{id.slice(cut)}</span>
    </span>
  );
}
