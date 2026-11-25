import { describe, expect, it } from 'vitest';
import { forms } from '../../documents';
import { findOptions } from './finder';
import { acceptsSecret, errorCount, groupErrors, hintOf, isSecretReference, within } from './issues';
import { groupsOf } from './presence';

const SP = forms['saml20-sp-remote'];
const IDP = forms['saml20-idp-hosted'];
const LDAP = forms['ldap:Ldap'];

describe('finder', () => {
  it('finds nothing without a query', () => {
    expect(findOptions(SP, {}, '  ')).toEqual([]);
  });

  it('searches names and titles, set or not, case aside', () => {
    const found = findOptions(SP, { 'sign.logout': true }, 'SIGN');

    expect(found.map((f) => f.name)).toContain('sign.logout');
    expect(found.map((f) => f.name)).toContain('saml20.sign.response');
    expect(found.find((f) => f.name === 'sign.logout')).toMatchObject({ set: true, group: 'Signing and validation', reason: null });
    expect(findOptions(SP, {}, 'organization url').map((f) => f.name)).toEqual(['OrganizationURL']);
  });

  it('never offers extra', () => {
    expect(findOptions(SP, {}, 'extra')).toEqual([]);
    expect(findOptions(SP, {}, 'uncataloged')).toEqual([]);
  });

  it('lists an option that does not apply with the reason', () => {
    const [found] = findOptions(IDP, {}, 'metadata.sign.algorithm');

    expect(found?.reason).toBe('Applies only when metadata.sign.enable is true.');
    expect(findOptions(IDP, { 'metadata.sign.enable': true }, 'metadata.sign.algorithm')[0]?.reason).toBeNull();
  });
});

describe('issues', () => {
  const issues = [
    { pointer: '/contacts/0/emailAddress', message: 'A', kind: 'error' as const },
    { pointer: '/contactsX', message: 'B', kind: 'error' as const },
    { pointer: '/contacts', message: 'C', kind: 'warning' as const },
  ];

  it('finds the issues of a value and of what it holds', () => {
    expect(within(issues, '/contacts').map((i) => i.message)).toEqual(['A', 'C']);
    expect(errorCount(within(issues, '/contacts'))).toBe(1);
  });

  it('counts the errors of a group from its rendered options', () => {
    const group = groupsOf(SP, { contacts: [] }).find((g) => g.title === 'Description');

    expect(group && groupErrors(group, issues)).toBe(1);
  });

  it('tells a Secret reference from a literal', () => {
    expect(isSecretReference('%secret(sp-key)%')).toBe(true);
    expect(isSecretReference('%env(CONSOLE_PASS)%')).toBe(true);
    expect(isSecretReference('%env(PASS)%')).toBe(false);
    expect(isSecretReference('%secret(a/b)%')).toBe(false);
    expect(isSecretReference('pass %secret(a)%')).toBe(false);
  });

  it('accepts a Secret reference only in a string without enum or x-literal', () => {
    expect(acceptsSecret(LDAP.properties.connection_string ?? { type: 'any' })).toBe(true);
    expect(acceptsSecret(LDAP.properties.encryption ?? { type: 'any' })).toBe(false);
    expect(acceptsSecret(forms['multiauth:MultiAuth'].properties.preselect ?? { type: 'any' })).toBe(false);
    expect(acceptsSecret({ type: 'integer' })).toBe(false);
  });

  it('hints the default, or else the first example', () => {
    expect(hintOf({ type: 'integer', default: 5, examples: [9] })).toEqual({ label: 'Default', value: '5' });
    expect(hintOf({ type: 'string', examples: ['sp.crt', 'x'] })).toEqual({ label: 'Example', value: 'sp.crt' });
    expect(hintOf({ type: 'boolean', default: false })).toEqual({ label: 'Default', value: 'false' });
    expect(hintOf({ type: 'string' })).toBeNull();
  });
});
