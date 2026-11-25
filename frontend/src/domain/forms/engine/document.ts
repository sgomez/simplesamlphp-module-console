export type Doc = Record<string, unknown>;

export function isObject(value: unknown): value is Doc {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Presence is the key, never the value.
export function isSet(doc: Doc, name: string): boolean {
  return Object.hasOwn(doc, name);
}

export function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === '') {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return isObject(value) && Object.keys(value).length === 0;
}

export function same(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => same(item, b[index]));
  }
  if (isObject(a) && isObject(b)) {
    const keys = Object.keys(a);

    return keys.length === Object.keys(b).length && keys.every((key) => isSet(b, key) && same(a[key], b[key]));
  }

  return false;
}

export function omit(doc: Doc, name: string): Doc {
  return Object.fromEntries(Object.entries(doc).filter(([key]) => key !== name));
}

// Inside a nested object an empty optional field is absent; a required one keeps its value for the schema to judge.
export function withField(doc: Doc, name: string, value: unknown, required: boolean): Doc {
  return isEmpty(value) && !required ? omit(doc, name) : { ...doc, [name]: value };
}

export function pointerOf(base: string, key: string | number): string {
  return `${base}/${String(key).replaceAll('~', '~0').replaceAll('/', '~1')}`;
}
