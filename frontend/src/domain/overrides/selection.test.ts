import { describe, expect, it } from 'vitest';
import { importPath, selectionOf } from './selection';

describe('the selection an Import confirms', () => {
  it('travels in the URL: whole sources, and entity IDs by source', () => {
    const selection = {
      set: 'saml20-idp-remote' as const,
      sources: [
        { position: 0, all: true, entityIds: ['https://ignored.example.org'] },
        { position: 2, all: false, entityIds: ['https://a.example.org/sp', 'urn:x:b'] },
      ],
    };
    const path = importPath(selection);

    expect(path).toBe('/external/import?set=saml20-idp-remote&all=0&id=2%3Ahttps%3A%2F%2Fa.example.org%2Fsp&id=2%3Aurn%3Ax%3Ab');
    expect(selectionOf(new URL(path, 'https://console.example.edu').searchParams)).toEqual({
      set: 'saml20-idp-remote',
      sources: [
        { position: 0, all: true, entityIds: [] },
        { position: 2, all: false, entityIds: ['https://a.example.org/sp', 'urn:x:b'] },
      ],
    });
  });

  it('reads an unknown set as service providers', () => {
    expect(selectionOf(new URLSearchParams('set=saml20-idp-hosted'))).toEqual({ set: 'saml20-sp-remote', sources: [] });
  });
});
