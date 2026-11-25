import { describe, expect, it } from 'vitest';
import cases from '../../../../tests/Fixtures/validation-parity.json';
import { validate, type DocumentSet, type SchemaError } from './validate';

const sorted = (errors: readonly SchemaError[]) =>
  [...errors].sort((a, b) => a.pointer.localeCompare(b.pointer) || a.message.localeCompare(b.message));

describe('validation parity with opis (SPEC 12.2)', () => {
  it.each(cases.map((c) => [`${c.set} ${c.fixture}`, c] as const))('%s', (_, c) => {
    expect(sorted(validate(c.set as DocumentSet, c.document))).toEqual(sorted(c.errors));
  });

  it('covers both verdicts', () => {
    expect(cases.some((c) => c.errors.length === 0)).toBe(true);
    expect(cases.some((c) => c.errors.length > 0)).toBe(true);
  });
});
