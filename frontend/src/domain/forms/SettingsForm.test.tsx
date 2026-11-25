import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { group, option, renderForm } from './test/harness';

const ACS = [{ Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST', Location: 'https://sp.example.org/acs' }];

describe('the Settings form', () => {
  it('renders only what is set and what is required, in the groups of the schema', () => {
    renderForm('saml20-sp-remote', { AssertionConsumerService: ACS, ForceAuthn: false });

    expect(document.querySelectorAll('.opt')).toHaveLength(2);
    expect(within(group('Endpoints')).getByText('1 of 3 set')).toBeDefined();
    expect(within(group('Request and session')).getByText('1 of 7 set')).toBeDefined();
    expect(within(option('AssertionConsumerService')).getByText('Required')).toBeDefined();
    expect(within(option('AssertionConsumerService')).queryByRole('button', { name: /^Unset/ })).toBeNull();
  });

  it('folds the groups that have nothing set', () => {
    renderForm('saml20-sp-remote', { AssertionConsumerService: ACS });

    expect(screen.getByRole('button', { name: /^Endpoints/ }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', { name: /^Encryption/ }).getAttribute('aria-expanded')).toBe('false');
  });

  it('adds an option from its group without fetching anything, and moves the focus to it', () => {
    const form = renderForm('saml20-sp-remote', { AssertionConsumerService: ACS });

    fireEvent.click(within(group('Endpoints')).getByRole('button', { name: 'Add SingleLogoutService' }));

    expect(form.current()).toEqual({ AssertionConsumerService: ACS, SingleLogoutService: [] });
    expect(within(group('Endpoints')).getByText('2 of 3 set')).toBeDefined();
    expect(document.activeElement).toBe(within(option('SingleLogoutService')).getByRole('button', { name: 'Add endpoint to Single logout service' }));
  });

  it('shows five add buttons, then the rest on request', () => {
    renderForm('saml20-sp-remote', { AssertionConsumerService: ACS, ForceAuthn: true });
    fireEvent.click(screen.getByRole('button', { name: /^Description/ }));

    const adds = () => within(group('Description')).getAllByRole('button', { name: /^Add / });
    expect(adds()).toHaveLength(5);
    fireEvent.click(within(group('Description')).getByRole('button', { name: 'and 6 more' }));
    expect(adds()).toHaveLength(11);
  });

  it('unsets an option by removing its key, with no confirmation', () => {
    const form = renderForm('saml20-sp-remote', { AssertionConsumerService: ACS, ForceAuthn: false });

    fireEvent.click(screen.getByRole('button', { name: 'Unset ForceAuthn' }));

    expect(form.current()).toEqual({ AssertionConsumerService: ACS });
    expect(within(group('Request and session')).getByRole('button', { name: 'Add ForceAuthn' })).toBeDefined();
  });

  it('keeps an option set to an empty value', () => {
    const form = renderForm('saml20-sp-remote', { AssertionConsumerService: ACS, SPNameQualifier: 'x' });

    fireEvent.change(screen.getByRole('textbox', { name: 'SP name qualifier' }), { target: { value: '' } });

    expect(form.current()).toEqual({ AssertionConsumerService: ACS, SPNameQualifier: '' });
    expect(screen.getByText('Minimum string length is 1, found 0')).toBeDefined();
  });
});
