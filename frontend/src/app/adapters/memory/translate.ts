import type { Doc } from '../../../domain/forms';

const PAD = '    ';

function literal(value: unknown, depth: number): string {
  if (typeof value === 'string') {
    return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value === null || value === undefined) {
    return 'null';
  }
  const list = Array.isArray(value);
  const entries = list ? value.map((item, index) => [index, item] as const) : Object.entries(value as Doc);
  if (entries.length === 0) {
    return '[]';
  }
  const inner = PAD.repeat(depth + 1);
  const lines = entries.map(([key, item]) => `${inner}${list ? '' : `${literal(key, 0)} => `}${literal(item, depth + 1)},`);

  return `[\n${lines.join('\n')}\n${PAD.repeat(depth)}]`;
}

// The translator's PHP view of a document, as the server would write it.
export function phpOf(entityId: string, doc: Doc): string {
  return `$metadata[${literal(entityId, 0)}] = ${literal(doc, 0)};`;
}
