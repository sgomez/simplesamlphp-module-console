import type { ErrorObject } from 'ajv/dist/2020';
import { ucs2length } from './runtime';

export type SchemaError = { pointer: string; message: string };

// The texts opis gives, which the module reports on save.
type Failure = ErrorObject & { names?: string[] };

function jsonType(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'number';
  }

  return typeof value;
}

const list = (value: unknown) => (Array.isArray(value) ? value.join(', ') : String(value));

const TEXTS: Record<string, (e: Failure) => string> = {
  type: (e) => `The data (${jsonType(e.data)}) must match the type: ${list(e.schema)}`,
  const: () => 'The data must match the const value',
  enum: () => 'The data should match one item from enum',
  format: (e) => `The data must match the '${String(e.params.format)}' format`,
  minLength: (e) => `Minimum string length is ${String(e.schema)}, found ${ucs2length(String(e.data))}`,
  pattern: (e) => `The string should match pattern: ${String(e.params.pattern)}`,
  minimum: (e) => `Number must be greater than or equal to ${String(e.schema)}`,
  minItems: (e) => `Array should have at least ${String(e.schema)} items, ${(e.data as unknown[]).length} found`,
  uniqueItems: () => 'Array must have unique items',
  contains: () => 'At least one array item must match schema',
  minProperties: (e) =>
    `Object must have at least ${String(e.schema)} properties, ${Object.keys(e.data as object).length} found`,
  required: (e) => `The required properties (${list(e.names)}) are missing`,
  dependentRequired: (e) =>
    `'${String(e.params.missingProperty)}' property is required by '${String(e.params.property)}' property`,
  additionalProperties: (e) => `Additional object properties are not allowed: ${list(e.names)}`,
  not: () => 'The data must not match schema',
};

function text(e: Failure): string {
  const own = (e.parentSchema?.$error as Record<string, unknown> | undefined)?.[e.keyword];
  if (typeof own === 'string') {
    return own;
  }
  const make = TEXTS[e.keyword];
  if (make === undefined) {
    throw new Error(`No message for the keyword ${e.keyword}`);
  }

  return make(e);
}

// opis checks property names only up to the first one that fails.
function firstNameOnly(errors: readonly ErrorObject[]): ErrorObject[] {
  const first = new Map<string, string>();
  for (const e of errors) {
    if (e.propertyName !== undefined && !first.has(e.instancePath)) {
      first.set(e.instancePath, e.propertyName);
    }
  }

  return errors.filter((e) => e.propertyName === undefined || first.get(e.instancePath) === e.propertyName);
}

// opis names every missing or extra property of an object in one error.
function merged(errors: readonly ErrorObject[]): Failure[] {
  const out: Failure[] = [];
  const groups = new Map<string, Failure>();
  for (const e of errors) {
    const name = e.params.missingProperty ?? e.params.additionalProperty;
    if (e.keyword !== 'required' && e.keyword !== 'additionalProperties') {
      out.push(e);
      continue;
    }
    const key = `${e.keyword} ${e.instancePath} ${e.schemaPath}`;
    const group = groups.get(key);
    if (group === undefined) {
      const failure = { ...e, names: [String(name)] };
      groups.set(key, failure);
      out.push(failure);
    } else {
      group.names?.push(String(name));
    }
  }

  return out;
}

// A failed `contains` reports only its own message, not why each item failed.
function withoutItemsOfContains(errors: readonly ErrorObject[]): ErrorObject[] {
  const contains = errors.filter((e) => e.keyword === 'contains');

  return errors.filter(
    (e) =>
      !contains.some(
        (c) => e.instancePath.startsWith(`${c.instancePath}/`) && e.schemaPath.startsWith(`${c.schemaPath}/`),
      ),
  );
}

export function report(errors: readonly ErrorObject[]): SchemaError[] {
  const seen = new Set<string>();
  const kept = firstNameOnly(withoutItemsOfContains(errors)).filter(
    (e) => e.keyword !== 'if' && e.keyword !== 'propertyNames',
  );

  return merged(kept)
    .map((e) => ({ pointer: e.instancePath, message: text(e) }))
    .filter(({ pointer, message }) => {
      const key = `${pointer}\n${message}`;
      const fresh = !seen.has(key);
      seen.add(key);

      return fresh;
    });
}
