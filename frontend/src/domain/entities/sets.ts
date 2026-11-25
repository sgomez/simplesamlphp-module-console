// The managed sets of SPEC 5, by core's name.
export type EntitySet = 'saml20-sp-remote' | 'saml20-idp-remote' | 'saml20-idp-hosted';

export interface SetWords {
  title: string;
  one: string;
  many: string;
  add: string;
}

// SPEC 10.3 and 10.8.
export const SET_WORDS: Record<EntitySet, SetWords> = {
  'saml20-sp-remote': { title: 'Service providers', one: 'service provider', many: 'service providers', add: 'Add service provider' },
  'saml20-idp-remote': { title: 'Identity providers', one: 'identity provider', many: 'identity providers', add: 'Add identity provider' },
  'saml20-idp-hosted': { title: 'Hosted IdP', one: 'hosted IdP', many: 'hosted IdPs', add: 'Add hosted IdP' },
};
