// @vitest-environment node
import Ajv2020, { type ErrorObject } from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import { declareKeywords } from './keywords';
import { rewrite, split } from './opis';

const own = (e: ErrorObject) => (e.parentSchema?.$error as Record<string, string> | undefined)?.[e.keyword];

function errors(schema: object, data: unknown) {
  const ajv = declareKeywords(new Ajv2020({ allErrors: true, verbose: true, strictTypes: false }));
  const check = ajv.compile(rewrite(split(schema) as Record<string, unknown>));

  return check(data)
    ? []
    : (check.errors ?? [])
        .filter((e) => e.keyword !== 'if')
        .map((e) => `${e.instancePath}${e.keyword} ${own(e) ?? e.params.missingProperty ?? ''}`.trim());
}

describe('split', () => {
  it('moves the keywords beside a $ref to their own allOf branch, as the module does', () => {
    expect(split({ title: 'T', 'x-widget': 'radio', $ref: '#/$defs/a', minItems: 1 })).toEqual({
      title: 'T',
      'x-widget': 'radio',
      allOf: [{ $ref: '#/$defs/a' }, { minItems: 1 }],
    });
  });

  it('leaves a $ref with annotations only as it is', () => {
    expect(split({ properties: { a: { title: 'T', $ref: '#/$defs/a' } } })).toEqual({
      properties: { a: { title: 'T', $ref: '#/$defs/a' } },
    });
  });
});

describe('a rewritten schema', () => {
  it('skips the checks of a type once a value check fails', () => {
    expect(errors({ type: 'string', enum: ['ab'], minLength: 3 }, 'x')).toEqual(['enum']);
  });

  it('skips the applicators once a check of the type fails', () => {
    const schema = { type: 'object', required: ['a'], allOf: [{ required: ['b'] }] };

    expect(errors(schema, {})).toEqual(['required a']);
    expect(errors(schema, { a: 1 })).toEqual(['required b']);
  });

  it('stops at the first failing branch of allOf', () => {
    expect(errors({ allOf: [{ required: ['a'] }, { required: ['b'] }] }, {})).toEqual(['required a']);
  });

  it('reports only the first property another one requires', () => {
    expect(errors({ dependentRequired: { a: ['b', 'c'] } }, { a: 1 })).toEqual(['dependentRequired b']);
  });

  it('reports only the first failing dependent schema', () => {
    const schema = { dependentSchemas: { a: { required: ['x'] }, b: { required: ['y'] } } };

    expect(errors(schema, { a: 1, b: 1 })).toEqual(['required x']);
  });

  it('keeps the message $error gives once the keyword moves', () => {
    const schema = { type: 'string', enum: ['a b'], pattern: '^\\S+$', $error: { pattern: 'No spaces.' } };

    expect(errors(schema, 'a b')).toEqual(['pattern No spaces.']);
  });

  it('accepts exactly what the original schema accepts', () => {
    const schema = {
      type: 'object',
      required: ['a'],
      properties: { a: { type: 'integer', minimum: 1 } },
      allOf: [{ minProperties: 1 }],
    };

    expect(errors(schema, { a: 2 })).toEqual([]);
  });
});

describe('the rewrite refuses', () => {
  it.each([
    ['a keyword the front end has no message for', { maxLength: 3 }, 'The keyword maxLength has no message'],
    ['a contains without its message', { contains: { const: 1 } }, 'A contains needs its message'],
    ['a contains holding a $ref', { contains: { $ref: '#/$defs/a' }, $error: { contains: 'm' } }, 'cannot hold a $ref'],
    ['a reference outside $defs', { $ref: '#/properties/a' }, 'does not point to a $defs entry'],
    ['an $error that is not a map of messages', { $error: 'm' }, '$error maps keywords to messages'],
    ['propertyNames that is not a schema object', { propertyNames: false }, 'propertyNames must be a schema object'],
    [
      'a $defs entry named like the ones it adds',
      { $defs: { opis1: { type: 'string' } }, type: 'string', enum: ['a'], minLength: 1 },
      'The $defs entry opis1 is reserved',
    ],
  ])('%s', (_, schema, message) => {
    expect(() => rewrite(split(schema) as Record<string, unknown>)).toThrow(message);
  });
});
