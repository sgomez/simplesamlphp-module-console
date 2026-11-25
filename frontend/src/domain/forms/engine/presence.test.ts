import { describe, expect, it } from 'vitest';
import { forms, type FormSchema } from '../../documents';
import { applies, groupsOf } from './presence';

const SP = forms['saml20-sp-remote'];
const IDP = forms['saml20-idp-hosted'];

const names = (schema: FormSchema, doc: Record<string, unknown>, title: string) => {
  const group = groupsOf(schema, doc).find((g) => g.title === title);

  return { rendered: group?.options.map((o) => o.name), addable: group?.addable.map((o) => o.name), set: group?.set, total: group?.total };
};

describe('presence', () => {
  it('shows only the required options of a new object', () => {
    const shown = groupsOf(SP, {}).flatMap((group) => group.options.map((o) => o.name));

    expect(shown).toEqual(['AssertionConsumerService']);
  });

  it('renders an option because its key exists, whatever its value', () => {
    const doc = { AssertionConsumerService: [], 'hide.from.discovery': false, name: {}, attributes: [] };

    expect(names(SP, doc, 'Description').rendered).toEqual(['name', 'hide.from.discovery']);
    expect(names(SP, doc, 'Attributes').rendered).toEqual(['attributes']);
  });

  it('offers every option that applies and is not set as an add button of its group', () => {
    const { addable } = names(SP, { sharedkey: '' }, 'Encryption');

    expect(addable).toEqual(['assertion.encryption', 'sharedkey_algorithm']);
  });

  it('counts the set options of a group against those that apply', () => {
    expect(names(SP, { ForceAuthn: true, audience: [] }, 'Request and session')).toMatchObject({ set: 2, total: 7 });
  });

  it('keeps extra alone in the last group, offered once', () => {
    const last = groupsOf(SP, {}).at(-1);

    expect(last?.title).toBe('Uncataloged options');
    expect(last?.addable.map((o) => o.name)).toEqual(['extra']);
    expect(groupsOf(SP, { extra: {} }).at(-1)?.options.map((o) => o.name)).toEqual(['extra']);
  });

  it('marks root required options so they cannot be unset', () => {
    const [identity] = groupsOf(IDP, { host: 'idp.example.org' });

    expect(identity?.options.map((o) => [o.name, o.set, o.required])).toEqual([
      ['host', true, true],
      ['auth', false, true],
    ]);
  });
});

describe('x-when', () => {
  const PUBLISHED = 'Published metadata';

  it('leaves an option out of its group and its count while its sibling does not allow it', () => {
    const { addable, total } = names(IDP, {}, PUBLISHED);

    expect(addable).not.toContain('metadata.sign.algorithm');
    expect(total).toBe(10);
  });

  it('offers an optional one as an add button once it applies', () => {
    const { addable, total } = names(IDP, { 'metadata.sign.enable': true }, PUBLISHED);

    expect(addable).toContain('metadata.sign.algorithm');
    expect(addable).toContain('metadata_sign_key');
    expect(total).toBe(12);
  });

  it('hides a set option that stops applying and drops it from the count', () => {
    const doc = { 'metadata.sign.enable': false, 'metadata.sign.algorithm': 'x' };
    const { rendered, set } = names(IDP, doc, PUBLISHED);

    expect(rendered).toEqual(['metadata.sign.enable']);
    expect(set).toBe(1);
  });

  it('applies when the sibling holds one of the values', () => {
    const node = { type: 'string' as const, when: { mode: ['all', 'list'] } };

    expect(applies(node, { mode: 'list' })).toBe(true);
    expect(applies(node, { mode: 'none' })).toBe(false);
    expect(applies(node, {})).toBe(false);
    expect(applies({ type: 'string' }, {})).toBe(true);
  });
});
