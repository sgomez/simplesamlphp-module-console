import { describe, expect, it } from 'vitest';
import { detectFormat, formatLabels, tooLarge } from './detect';

describe('the format of pasted configuration', () => {
  it('reads markup as metadata XML and anything else as a PHP array', () => {
    expect(detectFormat('  \n<md:EntityDescriptor/>')).toBe('xml');
    expect(detectFormat("$metadata['x'] = [];")).toBe('php');
    expect(detectFormat('')).toBe('php');
  });

  it('counts the entities of the format detected, a PHP array only when it holds several', () => {
    expect(formatLabels('<md:EntityDescriptor entityID="a"/>')).toEqual({ xml: 'SAML metadata · 1 entity', php: 'PHP array' });
    expect(formatLabels('<EntitiesDescriptor><EntityDescriptor/><md:EntityDescriptor/></EntitiesDescriptor>').xml).toBe('SAML metadata · 2 entities');
    expect(formatLabels("$metadata['a'] = [];")).toEqual({ xml: 'SAML metadata', php: 'PHP array' });
    expect(formatLabels("$metadata['a'] = [];\n$metadata ['b'] = [];").php).toBe('PHP array · 2 entities');
  });

  it('caps the input at 1 MiB, counted in bytes', () => {
    expect(tooLarge('a'.repeat(1024 * 1024))).toBe(false);
    expect(tooLarge(`${'a'.repeat(1024 * 1024 - 1)}é`)).toBe(true);
  });
});
