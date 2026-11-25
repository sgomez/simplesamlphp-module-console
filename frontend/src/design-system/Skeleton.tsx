const rows = [
  ['skel-34', 'skel-62'],
  ['skel-26', 'skel-54'],
] as const;

export function Skeleton() {
  return (
    <div className="card card-list" role="status" aria-busy="true" aria-label="Loading">
      {rows.map((widths) => (
        <div key={widths[0]} className="row">
          <div className="skel-row">
            {widths.map((width) => (
              <span key={width} className={`skel ${width}`} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
