import { describe, expect, it } from 'vitest';
import { forms } from '../../documents';
import { isEmpty, pointerOf, same, withField } from './document';
import { addMapRow, addOption, addRow, entriesOf, initialValue, moveRow, removeRow, renameKey, rowValue, setRow, unsetOption } from './values';

const SP = forms['saml20-sp-remote'];
const SAML_SP = forms['saml:SP'];

describe('adding a root option', () => {
  it('starts a boolean at the opposite of its default', () => {
    expect(addOption(SAML_SP, {}, 'enable_unsolicited')).toEqual({ enable_unsolicited: false });
    expect(addOption(SAML_SP, {}, 'ForceAuthn')).toEqual({ ForceAuthn: true });
  });

  it('starts a boolean without a default switched on', () => {
    expect(addOption(SP, {}, 'saml20.sign.response')).toEqual({ 'saml20.sign.response': true });
  });

  it('never writes the default of anything else', () => {
    expect(addOption(SAML_SP, {}, 'RelayState')).toEqual({ RelayState: '' });
    expect(addOption(SAML_SP, {}, 'ProtocolBinding')).toEqual({ ProtocolBinding: '' });
    expect(addOption(SP, {}, 'core:logout-timeout')).toEqual({ 'core:logout-timeout': null });
  });

  it('starts lists, maps and objects empty', () => {
    expect(addOption(SP, {}, 'contacts')).toEqual({ contacts: [] });
    expect(addOption(SP, {}, 'name')).toEqual({ name: {} });
    expect(addOption(SP, {}, 'signature_key')).toEqual({ signature_key: {} });
    expect(addOption(SP, {}, 'extra')).toEqual({ extra: {} });
  });

  it('keeps an option that is already set', () => {
    const doc = { ForceAuthn: false };

    expect(addOption(SP, doc, 'ForceAuthn')).toBe(doc);
  });

  it('unsets by removing the key', () => {
    expect(unsetOption({ a: 1, b: '' }, 'b')).toEqual({ a: 1 });
  });

  it('gives an unknown type no value', () => {
    expect(initialValue({ type: 'any' })).toBeNull();
  });
});

describe('nested fields', () => {
  it('drops an optional field left empty', () => {
    expect(withField({ a: 'x', b: 'y' }, 'b', '', false)).toEqual({ a: 'x' });
    expect(withField({ a: 'x' }, 'b', [], false)).toEqual({ a: 'x' });
    expect(withField({ a: 'x' }, 'b', {}, false)).toEqual({ a: 'x' });
    expect(withField({ a: 'x' }, 'b', null, false)).toEqual({ a: 'x' });
  });

  it('keeps a required field left empty, for the schema to judge', () => {
    expect(withField({}, 'b', '', true)).toEqual({ b: '' });
  });

  it('keeps false, which is a value', () => {
    expect(withField({}, 'b', false, false)).toEqual({ b: false });
    expect(isEmpty(false)).toBe(false);
    expect(isEmpty(0)).toBe(false);
  });
});

describe('list rows', () => {
  const contact = SP.properties.contacts?.items ?? { type: 'any' };

  it('adds a row with the required text fields of an object empty', () => {
    expect(addRow([], contact)).toEqual([{ contactType: '' }]);
    expect(rowValue({ type: 'string' })).toBe('');
    expect(rowValue({ type: 'integer' })).toBeNull();
  });

  it('removes, replaces and moves rows', () => {
    expect(removeRow(['a', 'b', 'c'], 1)).toEqual(['a', 'c']);
    expect(setRow(['a', 'b'], 0, 'z')).toEqual(['z', 'b']);
    expect(moveRow(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
    expect(moveRow(['a', 'b', 'c'], 2, -1)).toEqual(['a', 'c', 'b']);
  });

  it('does not move a row past either end', () => {
    expect(moveRow(['a', 'b'], 0, -1)).toEqual(['a', 'b']);
    expect(moveRow(['a', 'b'], 1, 1)).toEqual(['a', 'b']);
  });
});

describe('map rows', () => {
  it('renames a key in place and refuses a key already there', () => {
    expect(Object.keys(renameKey({ en: 'A', es: 'B' }, 'en', 'fr'))).toEqual(['fr', 'es']);
    expect(renameKey({ en: 'A', es: 'B' }, 'en', 'es')).toEqual({ en: 'A', es: 'B' });
  });

  it('adds one empty row at a time', () => {
    const once = addMapRow({ en: 'A' }, { type: 'string' });

    expect(once).toEqual({ en: 'A', '': '' });
    expect(addMapRow(once, { type: 'string' })).toBe(once);
    expect(entriesOf(once)).toEqual([['en', 'A'], ['', '']]);
    expect(entriesOf('x')).toEqual([]);
  });
});

describe('document helpers', () => {
  it('compares values deeply', () => {
    expect(same({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
    expect(same({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(same([1], [2])).toBe(false);
    expect(same([], {})).toBe(false);
  });

  it('escapes a JSON pointer token', () => {
    expect(pointerOf('/a', 'b/c~d')).toBe('/a/b~1c~0d');
    expect(pointerOf('', 0)).toBe('/0');
  });
});
