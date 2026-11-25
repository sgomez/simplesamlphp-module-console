import type { FormNode } from '../../documents';
import { hintOf } from '../engine/issues';

// The description, then the default or else the first example.
export function Hint({ node }: { node: FormNode }) {
  const hint = hintOf(node);
  if (node.description === undefined && hint === null) {
    return null;
  }

  return (
    <div className="help">
      {node.description && <span>{node.description}</span>}
      {hint && (
        <span>
          {` ${hint.label}: `}
          <span className="mono">{hint.value}</span>
        </span>
      )}
    </div>
  );
}
