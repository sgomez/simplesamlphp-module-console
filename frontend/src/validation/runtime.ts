// The two helpers Ajv's standalone code calls, so that the bundle needs nothing from Ajv itself.

export function ucs2length(value: string): number {
  return [...value].length;
}

export function equal(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) {
    return false;
  }
  const left = Object.entries(a);
  const right = new Map(Object.entries(b));

  return left.length === right.size && left.every(([key, value]) => right.has(key) && equal(value, right.get(key)));
}
