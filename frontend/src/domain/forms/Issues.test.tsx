import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { group, option, renderForm } from './test/harness';

const ACS = [{ Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST', Location: 'https://sp.example.org/acs' }];

describe('what the form checks', () => {
  it('checks every change against the schema at once and marks the field', () => {
    renderForm('saml20-sp-remote', { AssertionConsumerService: ACS, ProxyCount: 2 });

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Proxy count' }), { target: { value: '-1' } });

    expect(within(option('ProxyCount')).getByText('Number must be greater than or equal to 0')).toBeDefined();
    expect(screen.getByRole('spinbutton', { name: 'Proxy count' }).getAttribute('aria-invalid')).toBe('true');
    expect(within(group('Request and session')).getByText('1 error')).toBeDefined();
  });

  it('empties a number field to null', () => {
    const form = renderForm('saml20-sp-remote', { AssertionConsumerService: ACS, ProxyCount: 2 });

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Proxy count' }), { target: { value: '' } });

    expect(form.current().ProxyCount).toBeNull();
  });

  it('shows what the server found at its field, and errors in the index', () => {
    renderForm('saml20-sp-remote', { AssertionConsumerService: ACS, contacts: [{ contactType: 'support' }] }, {
      issues: [
        { pointer: '/contacts/0', message: 'The support contact has no email address.', kind: 'error' },
        { pointer: '/AssertionConsumerService', message: 'Looks odd.', kind: 'warning' },
      ],
    });

    expect(within(option('contacts')).getByText('The support contact has no email address.').parentElement?.className).toBe('msg-error');
    expect(within(option('AssertionConsumerService')).getByText('Looks odd.').parentElement?.className).toBe('msg-warning');
    const index = within(screen.getByRole('navigation', { name: 'Groups on this page' }));
    expect(index.getByRole('link', { name: /Description/ }).getAttribute('href')).toBe('#g-2');
    expect(within(index.getByRole('link', { name: /Description/ })).getByText('1 error')).toBeDefined();
    expect(within(index.getByRole('link', { name: /Endpoints/ })).getByText('1 of 3')).toBeDefined();
  });

  it('marks the options edited since the saved document', () => {
    renderForm('saml20-sp-remote', { AssertionConsumerService: ACS, ForceAuthn: true }, { saved: { AssertionConsumerService: ACS, ForceAuthn: false } });

    expect(within(option('ForceAuthn')).getByText('Edited')).toBeDefined();
    expect(within(option('AssertionConsumerService')).queryByText('Edited')).toBeNull();
  });

  it('lists an error of the whole document apart', () => {
    renderForm('saml20-sp-remote', {});

    expect(screen.getByText('The required properties (AssertionConsumerService) are missing')).toBeDefined();
  });
});
