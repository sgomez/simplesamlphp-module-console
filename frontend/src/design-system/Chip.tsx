export function Chip({ title, children }: { title?: string; children: string }) {
  return (
    <span className="chip" title={title}>
      {children}
    </span>
  );
}
