import type { SchemaOption } from '../../documents';

interface Scan {
  // The bracket depth at the end of each line, from line 1.
  depths: number[];
  // Each key at depth 1, the object's root options, and its line.
  keys: Map<string, number>;
  // The offset of the bracket that closes the root array.
  close: number | null;
}

// A lexical walk over strings, comments and brackets; the text is read on the server, this only places things.
function scan(text: string): Scan {
  const depths: number[] = [];
  const keys = new Map<string, number>();
  let depth = 0;
  let line = 1;
  let close: number | null = null;
  const pass = (skipped: string) => {
    const count = skipped.split('\n').length - 1;
    depths.push(...Array<number>(count).fill(depth));
    line += count;
  };
  for (let at = 0; at < text.length; at++) {
    const char = text[at];
    if (char === '\n') {
      depths.push(depth);
      line++;
    } else if (char === "'" || char === '"') {
      let end = at + 1;
      while (end < text.length && text[end] !== char) {
        end += text[end] === '\\' ? 2 : 1;
      }
      const key = text.slice(at + 1, end);
      if (depth === 1 && /^\s*=>/.test(text.slice(end + 1)) && !keys.has(key)) {
        keys.set(key, line);
      }
      pass(key);
      at = end;
    } else if (char === '#' || (char === '/' && text[at + 1] === '/')) {
      const end = text.indexOf('\n', at);
      at = (end === -1 ? text.length : end) - 1;
    } else if (char === '/' && text[at + 1] === '*') {
      const end = text.indexOf('*/', at + 2);
      const stop = end === -1 ? text.length : end + 1;
      pass(text.slice(at, stop));
      at = stop;
    } else if (char === '[' || char === '(') {
      depth++;
    } else if (char === ']' || char === ')') {
      if (depth === 1) {
        close = at;
      }
      depth--;
    }
  }
  depths.push(depth);

  return { depths, keys, close };
}

// The line each root option of the text is on.
export function optionLines(text: string): ReadonlyMap<string, number> {
  return scan(text).keys;
}

export function phpLiteral(value: unknown): string {
  if (typeof value === 'string') {
    return `'${value.replace(/[\\']/g, '\\$&')}'`;
  }
  if (Array.isArray(value)) {
    return `[${value.map(phpLiteral).join(', ')}]`;
  }
  if (value !== null && typeof value === 'object') {
    return `[${Object.entries(value).map(([key, item]) => `${phpLiteral(key)} => ${phpLiteral(item)}`).join(', ')}]`;
  }

  return value === undefined || value === null ? 'null' : String(value);
}

const EMPTY: Record<string, unknown> = { boolean: false, integer: 0, number: 0, array: [], object: [] };

function lineStart(text: string, line: number): number {
  let at = 0;
  for (let n = 1; n < line; n++) {
    at = text.indexOf('\n', at) + 1;
  }

  return at;
}

// An option with its default, on a line of its own: after the cursor's line when that line sits between root
// options, otherwise last in the root array. `at` is where the cursor goes after it.
export function insertOption(text: string, cursor: number, option: SchemaOption): { text: string; at: number } {
  const entry = `    ${phpLiteral(option.name)} => ${phpLiteral(option.default ?? EMPTY[option.type] ?? '')},`;
  const { depths, close } = scan(text);
  const cursorLine = text.slice(0, cursor).split('\n').length;
  const closeLine = close === null ? null : text.slice(0, close).split('\n').length;
  let line: number;
  if (depths[cursorLine - 1] === 1 && (closeLine === null || cursorLine < closeLine)) {
    line = cursorLine + 1;
  } else if (closeLine !== null) {
    line = closeLine;
  } else {
    return { text: text.slice(0, cursor) + entry + text.slice(cursor), at: cursor + entry.length };
  }
  const lines = text.split('\n');
  lines.splice(line - 1, 0, entry);

  return { text: lines.join('\n'), at: lines.slice(0, line).join('\n').length };
}

// The suggestion of an unknown option, put in place of its key on its line.
export function replaceKey(text: string, line: number, from: string, to: string): string {
  const start = lineStart(text, line);
  const end = text.indexOf('\n', start);
  const stop = end === -1 ? text.length : end;
  const found = text.slice(start, stop).replace(/(['"])((?:\\.|(?!\1).)*)\1/, (match, quote: string, key: string) =>
    key === from ? `${quote}${to}${quote}` : match,
  );

  return text.slice(0, start) + found + text.slice(stop);
}
