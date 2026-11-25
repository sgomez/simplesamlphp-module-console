// Rewrites a schema so that Ajv, reporting every error, reports the ones opis reports through the module.
// The rewritten schema accepts exactly the same documents.

type Schema = boolean | SchemaObject;
type SchemaObject = { [keyword: string]: unknown };

const ANNOTATIONS = ['title', 'description', 'examples', 'default', '$comment', '$schema'];

const BEFORE = ['type', 'const', 'enum', 'format'];
const AFTER = ['if', 'then', 'else', 'allOf', 'not', '$ref'];
const TYPED: Record<string, string[]> = {
  string: ['minLength', 'maxLength', 'pattern'],
  number: ['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf'],
  array: ['minItems', 'maxItems', 'uniqueItems', 'contains', 'prefixItems', 'items'],
  object: [
    'minProperties',
    'maxProperties',
    'required',
    'dependentRequired',
    'dependentSchemas',
    'propertyNames',
    'properties',
    'patternProperties',
    'additionalProperties',
  ],
};
const TYPED_ALL = Object.values(TYPED).flat();

// The keywords the front end has a message for, and those that only lead to other schemas.
const SUPPORTED = new Set([
  ...BEFORE,
  ...['if', 'then', 'else', 'allOf', 'not', '$ref'],
  ...['minLength', 'pattern', 'minimum', 'minItems', 'uniqueItems', 'contains', 'items'],
  ...['minProperties', 'required', 'dependentRequired', 'dependentSchemas', 'propertyNames', 'properties'],
  'additionalProperties',
]);
const NON_VALIDATING = /^(\$schema|\$defs|\$comment|\$error|title|description|examples|default|x-[a-z-]+)$/;

const SINGLE = ['additionalProperties', 'items', 'contains', 'propertyNames', 'not', 'if', 'then', 'else'];
const MAPS = ['properties', '$defs', 'dependentSchemas'];

const isObject = (value: unknown): value is SchemaObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const pick = (node: SchemaObject, keep: (key: string) => boolean): SchemaObject =>
  Object.fromEntries(Object.entries(node).filter(([key]) => keep(key)));

const filled = (group: SchemaObject) => Object.keys(pick(group, (k) => k !== '$error')).length > 0;

// The same move as the module's SchemaSplitter: keywords beside a `$ref` go to their own `allOf` branch.
export function split(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(split);
  }
  if (!isObject(node)) {
    return node;
  }
  const out = Object.fromEntries(Object.entries(node).map(([key, value]) => [key, split(value)]));
  if (!('$ref' in out)) {
    return out;
  }
  const outer = pick(out, (key) => ANNOTATIONS.includes(key) || key.startsWith('x-'));
  const rules = pick(out, (key) => !(key in outer) && key !== '$ref');

  return Object.keys(rules).length === 0 ? out : { ...outer, allOf: [{ $ref: out.$ref }, rules] };
}

function check(node: SchemaObject): void {
  for (const key of Object.keys(node)) {
    if (!SUPPORTED.has(key) && !NON_VALIDATING.test(key)) {
      throw new Error(`The keyword ${key} has no message in the front end`);
    }
  }
  if ('contains' in node && !(isObject(node.$error) && typeof node.$error.contains === 'string')) {
    throw new Error('A contains needs its message in $error');
  }
  if ('contains' in node && JSON.stringify(node.contains).includes('"$ref"')) {
    throw new Error('A contains cannot hold a $ref: its item errors are told apart by their schema path');
  }
  if ('$error' in node && !(isObject(node.$error) && Object.values(node.$error).every((m) => typeof m === 'string'))) {
    throw new Error('$error maps keywords to messages');
  }
  if ('propertyNames' in node && !isObject(node.propertyNames)) {
    throw new Error('propertyNames must be a schema object');
  }
  if (typeof node.$ref === 'string' && !/^([^#]*\.json)?#\/\$defs\/[^/]+$/.test(node.$ref)) {
    throw new Error(`The reference ${node.$ref} does not point to a $defs entry`);
  }
}

// The type check alone gates nothing when every other keyword applies only to the type it requires.
function gatesNothing(before: SchemaObject, rest: SchemaObject): boolean {
  if (Object.keys(before).some((key) => key !== 'type' && key !== '$error') || typeof before.type !== 'string') {
    return false;
  }
  const own = TYPED[before.type === 'integer' ? 'number' : before.type] ?? [];

  return Object.keys(rest).every((key) => own.includes(key) || key === '$error');
}

export function rewrite(root: SchemaObject): SchemaObject {
  const hoisted: SchemaObject = {};

  // A schema used twice is compiled once, behind a reference.
  const shared = (schema: Schema): Schema => {
    const name = `opis${Object.keys(hoisted).length + 1}`;
    if (isObject(root.$defs) && name in root.$defs) {
      throw new Error(`The $defs entry ${name} is reserved for the rewrite`);
    }
    hoisted[name] = schema;

    return { $ref: `#/$defs/${name}` };
  };

  const onlyIfPasses = (first: Schema, next: Schema): Schema => {
    const ref = shared(first);

    return { if: ref, then: next, else: ref };
  };

  // opis stops at the first failing schema of `allOf`, of `dependentSchemas` and of `dependentRequired`.
  const firstFailing = (schemas: Schema[]): Schema => {
    const [head, ...rest] = schemas;
    if (head === undefined) {
      return true;
    }

    return rest.length === 0 ? head : onlyIfPasses(head, firstFailing(rest));
  };

  const children = (node: SchemaObject): SchemaObject => {
    const out: SchemaObject = { ...node };
    for (const key of SINGLE.filter((k) => k in out)) {
      out[key] = order(out[key] as Schema);
    }
    for (const key of MAPS.filter((k) => k in out)) {
      out[key] = Object.fromEntries(Object.entries(out[key] as SchemaObject).map(([k, s]) => [k, order(s as Schema)]));
    }
    if (Array.isArray(out.allOf)) {
      out.allOf = (out.allOf as Schema[]).map(order);
    }

    return out;
  };

  const typed = (node: SchemaObject): SchemaObject => {
    const group = pick(node, (k) => TYPED_ALL.includes(k) && k !== 'dependentRequired' && k !== 'dependentSchemas');
    const chains: Schema[] = [];
    if (isObject(node.dependentRequired)) {
      const pairs = Object.entries(node.dependentRequired as Record<string, string[]>).flatMap(([name, props]) =>
        props.map((prop) => ({ dependentRequired: { [name]: [prop] } })),
      );
      chains.push(firstFailing(pairs));
    }
    if (isObject(node.dependentSchemas)) {
      const entries = Object.entries(node.dependentSchemas).map(([name, s]) => ({ dependentSchemas: { [name]: s } }));
      chains.push(firstFailing(entries));
    }

    return chains.length === 0 ? group : { ...group, allOf: chains };
  };

  const after = (node: SchemaObject): SchemaObject => {
    const group = pick(node, (k) => AFTER.includes(k));
    if (Array.isArray(node.allOf)) {
      group.allOf = [firstFailing(node.allOf as Schema[])];
    }

    return group;
  };

  const withError = (group: SchemaObject, node: SchemaObject): SchemaObject =>
    '$error' in node && filled(group) ? { ...group, $error: node.$error } : group;

  const tailOf = (types: SchemaObject, applicators: SchemaObject): SchemaObject => {
    if (!filled(types)) {
      return applicators;
    }

    return filled(applicators) ? (onlyIfPasses(types, applicators) as SchemaObject) : types;
  };

  // opis runs a schema's keywords in three groups, each only if the previous one passed: the type and
  // value checks, the checks of the data's type, then the applicators.
  function order(schema: Schema): Schema {
    if (!isObject(schema)) {
      return schema;
    }
    check(schema);
    const node = children(schema);
    const kept = pick(node, (k) => !BEFORE.includes(k) && !AFTER.includes(k) && !TYPED_ALL.includes(k));
    const before = withError(pick(node, (k) => BEFORE.includes(k)), node);
    const tail = tailOf(withError(typed(node), node), withError(after(node), node));
    if (!filled(before)) {
      return { ...kept, ...tail };
    }
    if (!filled(tail) || ('if' in tail === false && gatesNothing(before, tail))) {
      return { ...kept, ...before, ...tail };
    }

    return { ...kept, ...(onlyIfPasses(before, tail) as SchemaObject) };
  }

  const out = order(root) as SchemaObject;

  return Object.keys(hoisted).length === 0 ? out : { ...out, $defs: { ...(out.$defs as SchemaObject), ...hoisted } };
}
