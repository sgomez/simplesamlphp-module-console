import { describe, expect, it } from 'vitest';
import { forms, type FormSchema } from '../../documents';
import { groupsOf, requiredIn } from './presence';

const SP = forms['saml20-sp-remote'];

describe('required by a branch', () => {
  const schema: FormSchema = {
    type: 'object',
    groups: [{ title: 'All', properties: ['enable', 'list', 'pattern', 'a', 'b'] }],
    properties: {
      enable: { type: 'boolean' },
      list: { type: 'array', when: { enable: [true] } },
      pattern: { type: 'string', when: { enable: [false] } },
      a: { type: 'string' },
      b: { type: 'string' },
    },
    rules: [
      { if: { name: 'enable', value: true }, then: ['list'], else: ['pattern'] },
      { present: 'a', then: ['b'] },
    ],
  };

  it('requires what the matching branch names', () => {
    expect([...requiredIn(schema, { enable: true })]).toEqual(['list']);
    expect([...requiredIn(schema, { enable: false })]).toEqual(['pattern']);
    expect([...requiredIn(schema, {})]).toEqual(['pattern']);
  });

  it('renders an option a branch makes required on its own', () => {
    const [group] = groupsOf(schema, { enable: true });

    expect(group?.options.map((o) => [o.name, o.required])).toEqual([
      ['enable', false],
      ['list', true],
    ]);
  });

  it('requires the dependents of a set key', () => {
    const [group] = groupsOf(schema, { a: 'x' });

    expect(group?.options.map((o) => o.name)).toEqual(['a', 'b']);
  });

  it('reads the branches of a nested object too', () => {
    const certificate = SP.properties.signature_key?.properties?.certificate;

    expect([...requiredIn(certificate ?? { type: 'object' }, { source: 'pasted' })]).toEqual(['source', 'pem']);
    expect([...requiredIn(certificate ?? { type: 'object' }, { source: 'file' })]).toEqual(['source', 'file']);
  });
});
