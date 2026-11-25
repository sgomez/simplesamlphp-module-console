import type { SessionLinks } from '../../../domain/database';
import type { Counts, SessionPort } from '../../../domain/session';

export const memorySession: SessionPort = {
  screens: ['overview', 'service-providers', 'identity-providers', 'hosted-idp', 'external', 'authsources', 'publish', 'history', 'nodes'],
};

export const boardLinks: SessionLinks = {
  identity: 'admin',
  core: {
    configuration: '/simplesaml/module.php/admin/',
    test: '/simplesaml/module.php/admin/test',
    federation: '/simplesaml/module.php/admin/federation',
  },
  logoutUrl: '/simplesaml/module.php/core/logout/admin',
};

// The Sidebar board's counts.
export const boardCounts: Counts = {
  'saml20-sp-remote': 42,
  'saml20-idp-remote': 6,
  external: 3180,
  authsources: 5,
  nodes: 3,
};
