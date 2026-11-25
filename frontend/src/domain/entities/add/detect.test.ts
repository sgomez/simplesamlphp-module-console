import { describe, expect, it } from 'vitest';
import { detectFormat, formatChoices } from './detect';

describe('the format of pasted configuration', () => {
  it('reads markup as metadata XML and anything else as a PHP array', () => {
    expect(detectFormat('  \n<md:EntityDescriptor/>')).toBe('xml');
    expect(detectFormat("$metadata['x'] = [];")).toBe('php');
    expect(detectFormat('')).toBe('php');
  });

  it('counts the entities the XML describes, with or without a prefix', () => {
    expect(formatChoices('<md:EntityDescriptor entityID="a"/>').xml).toBe('SAML metadata · 1 entity');
    expect(formatChoices('<EntitiesDescriptor><EntityDescriptor/><md:EntityDescriptor/></EntitiesDescriptor>').xml).toBe(
      'SAML metadata · 2 entities',
    );
    expect(formatChoices("$metadata['x'] = [];")).toEqual({ xml: 'SAML metadata', php: 'PHP array' });
  });
});
