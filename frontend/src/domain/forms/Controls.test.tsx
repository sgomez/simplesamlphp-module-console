import { act, fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { option, renderForm } from './test/harness';

const POST = 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST';
const ACS = [{ Binding: POST, Location: 'https://sp.example.org/acs' }];

async function chooseMenu(button: HTMLElement, entry: string) {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame'] });
  fireEvent.click(button);
  fireEvent.click(screen.getByRole('menuitem', { name: entry }));
  await act(async () => {
    vi.advanceTimersByTime(50);
  });
  vi.useRealTimers();
}

describe('list rows', () => {
  it('adds, removes and moves rows of one control', async () => {
    const form = renderForm('saml20-sp-remote', { AssertionConsumerService: ACS, audience: ['a', 'b'] });
    const audience = () => form.current().audience;

    fireEvent.click(within(option('audience')).getByRole('button', { name: 'Add value to Additional audiences' }));
    expect(audience()).toEqual(['a', 'b', '']);
    fireEvent.change(screen.getByRole('textbox', { name: 'Additional audiences, value 3' }), { target: { value: 'c' } });
    expect(audience()).toEqual(['a', 'b', 'c']);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Additional audiences, value 1' }));
    expect(audience()).toEqual(['b', 'c']);
    await chooseMenu(screen.getByRole('button', { name: 'Move Additional audiences, value 2' }), 'Move up');
    expect(audience()).toEqual(['c', 'b']);
  });

  it('puts the fields of a simple row on one line, an empty optional one absent', () => {
    const form = renderForm('saml20-sp-remote', { AssertionConsumerService: ACS });
    const location = 'Assertion consumer service, endpoint 1, Location';

    expect(screen.getByRole('textbox', { name: location }).getAttribute('placeholder')).toBe('Location');
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Assertion consumer service, endpoint 1, Index' }), { target: { value: '0' } });
    expect(form.current().AssertionConsumerService).toEqual([{ ...ACS[0], index: 0 }]);
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Assertion consumer service, endpoint 1, Index' }), { target: { value: '' } });
    expect(form.current().AssertionConsumerService).toEqual(ACS);
  });

  it('gives a row of an object all its fields, with its required text fields', () => {
    const form = renderForm('saml20-sp-remote', { AssertionConsumerService: ACS, contacts: [] });

    fireEvent.click(within(option('contacts')).getByRole('button', { name: 'Add contact to Contacts' }));

    expect(form.current().contacts).toEqual([{ contactType: '' }]);
    const type = screen.getByRole('combobox', { name: 'Contacts, contact 1, Type' }) as HTMLSelectElement;
    expect(type.value).toBe('');
    fireEvent.change(type, { target: { value: 'technical' } });
    expect(form.current().contacts).toEqual([{ contactType: 'technical' }]);
    expect(screen.getByRole('button', { name: 'Add value to Contacts, contact 1, Email addresses' })).toBeDefined();
  });
});

describe('language maps', () => {
  it('edits rows of language and text', () => {
    const form = renderForm('saml20-sp-remote', { AssertionConsumerService: ACS, name: { en: 'Moodle' } });

    fireEvent.click(within(option('name')).getByRole('button', { name: 'Add language to Name' }));
    expect(within(option('name')).getByRole('button', { name: 'Add language to Name' }).hasAttribute('disabled')).toBe(true);
    fireEvent.change(screen.getByRole('textbox', { name: 'Name, language 2' }), { target: { value: 'es' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Name, text 2' }), { target: { value: 'Campus' } });
    expect(form.current().name).toEqual({ en: 'Moodle', es: 'Campus' });
    fireEvent.click(screen.getByRole('button', { name: 'Remove Name, language 1' }));
    expect(form.current().name).toEqual({ es: 'Campus' });
  });

  it('marks a language code the schema refuses', () => {
    renderForm('saml20-sp-remote', { AssertionConsumerService: ACS, name: { English: 'Moodle' } });

    expect(within(option('name')).getByText('A language is a code such as en, es or pt-BR.')).toBeDefined();
  });
});
