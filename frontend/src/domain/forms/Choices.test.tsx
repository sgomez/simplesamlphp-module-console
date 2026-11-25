import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderForm } from './test/harness';

const ACS = [{ Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST', Location: 'https://sp.example.org/acs' }];

describe('choices', () => {
  it('shows an enum as a select with no choice yet', () => {
    const form = renderForm('saml20-sp-remote', { AssertionConsumerService: ACS, 'signature.algorithm': '' });
    const select = screen.getByRole('combobox', { name: 'Signature algorithm' }) as HTMLSelectElement;

    expect(select.value).toBe('');
    fireEvent.change(select, { target: { value: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256' } });
    expect(form.current()['signature.algorithm']).toBe('http://www.w3.org/2001/04/xmldsig-more#rsa-sha256');
  });

  it('shows an enum with x-widget radio as radio buttons', () => {
    const form = renderForm('ldap:Ldap', { connection_string: 'ldaps://ldap', connector: '', search: { enable: true, base: ['dc=x'] }, attributes: { mode: 'all' } });
    const ad = 'SimpleSAML\\Module\\ldap\\Connector\\ActiveDirectory';

    fireEvent.click(screen.getByRole('radio', { name: ad }));

    expect(form.current().connector).toBe(ad);
  });

  it('offers the authsource ids the server gives, or a text field without them', () => {
    renderForm('multiauth:MultiAuth', { sources: [{ source: 'a' }] }, { capabilities: { authsources: ['a', 'b'] } });

    expect(screen.getByRole('combobox', { name: 'Sources, source 1, Authsource' })).toBeDefined();
  });

  it('switches a boolean', () => {
    const form = renderForm('saml20-sp-remote', { AssertionConsumerService: ACS, ForceAuthn: false });

    fireEvent.click(screen.getByRole('switch', { name: 'Always force re-authentication' }));

    expect(form.current().ForceAuthn).toBe(true);
  });
});
