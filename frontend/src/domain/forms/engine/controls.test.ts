import { describe, expect, it } from 'vitest';
import { forms } from '../../documents';
import { controlOf, isInline, rowName } from './controls';

const SP = forms['saml20-sp-remote'];

describe('controls', () => {
  const p = SP.properties;

  it('follows the type', () => {
    expect(controlOf(p.SPNameQualifier ?? { type: 'any' })).toBe('text');
    expect(controlOf(p.ForceAuthn ?? { type: 'any' })).toBe('switch');
    expect(controlOf(p.ProxyCount ?? { type: 'any' })).toBe('number');
    expect(controlOf(p['signature.algorithm'] ?? { type: 'any' })).toBe('select');
    expect(controlOf(p.contacts ?? { type: 'any' })).toBe('rows');
    expect(controlOf(p.name ?? { type: 'any' })).toBe('map');
    expect(controlOf(p.RegistrationInfo ?? { type: 'any' })).toBe('fields');
    expect(controlOf({ type: 'any' })).toBe('json');
  });

  it('follows x-widget where it says otherwise', () => {
    expect(controlOf(p.authproc ?? { type: 'any' })).toBe('json');
    expect(controlOf(p.extra ?? { type: 'any' })).toBe('json');
    expect(controlOf(p.certificates ?? { type: 'any' })).toBe('certificates');
    expect(controlOf(p.signature_key ?? { type: 'any' })).toBe('fields');
    expect(controlOf(p.signature_key?.properties?.certificate ?? { type: 'any' })).toBe('certificate');
    expect(controlOf(p.certificates?.items?.properties?.use ?? { type: 'any' })).toBe('radio');
    expect(controlOf(p.certificates?.items?.properties?.pem ?? { type: 'any' })).toBe('textarea');
    expect(controlOf(p.AssertionConsumerService?.items?.properties?.Binding ?? { type: 'any' })).toBe('suggest');
    expect(controlOf(p.sharedkey ?? { type: 'any' })).toBe('secret');
    expect(controlOf(forms['multiauth:MultiAuth'].properties.sources?.items?.properties?.source ?? { type: 'any' })).toBe('authsource');
  });

  it('puts a row of single-line fields on one line', () => {
    expect(isInline(p.AssertionConsumerService?.items ?? { type: 'any' })).toBe(true);
    expect(isInline(p.contacts?.items ?? { type: 'any' })).toBe(false);
  });

  it('names a row by its title', () => {
    expect(rowName(p.AssertionConsumerService?.items ?? { type: 'any' })).toBe('endpoint');
    expect(rowName({ type: 'string' })).toBe('value');
  });
});
