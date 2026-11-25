import { SP_LIST } from '../domain/entities';
import { PUBLISH } from '../domain/publication';
import type { Screen } from '../domain/session';

export { editPath, SP_EDIT, SP_LIST, SP_NEW } from '../domain/entities';
export { PUBLISH } from '../domain/publication';

// SPEC 10.4.
export const SCREENS: Record<Screen, string> = {
  overview: '/',
  'service-providers': SP_LIST,
  'identity-providers': '/entities/saml20-idp-remote',
  'hosted-idp': '/entities/saml20-idp-hosted',
  external: '/external',
  authsources: '/authsources',
  publish: PUBLISH,
  history: '/history',
  nodes: '/nodes',
};
