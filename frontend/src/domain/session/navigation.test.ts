import { describe, expect, it } from 'vitest';
import { navigation, type Screen } from './navigation';

const ALL: Screen[] = ['overview', 'service-providers', 'identity-providers', 'hosted-idp', 'external', 'authsources', 'publish', 'history', 'nodes'];
const core = { configuration: '/admin/', test: '/admin/test', federation: '/admin/federation' };
const counts = { 'saml20-sp-remote': 42, 'saml20-idp-remote': 6, external: 3180, authsources: 5, nodes: 3 };

describe('navigation', () => {
  it('holds every entry of SPEC 10.3 in its group and order, with the counts and the Publish badge', () => {
    expect(navigation(ALL, counts, 7, core)).toEqual([
      { head: null, entries: [{ screen: 'overview', label: 'Overview', count: null, badge: null }] },
      {
        head: 'Entities',
        entries: [
          { screen: 'service-providers', label: 'Service providers', count: 42, badge: null },
          { screen: 'identity-providers', label: 'Identity providers', count: 6, badge: null },
          { screen: 'hosted-idp', label: 'Hosted IdP', count: null, badge: null },
          { screen: 'external', label: 'External entities', count: 3180, badge: null },
        ],
      },
      { head: 'Login', entries: [{ screen: 'authsources', label: 'Authsources', count: 5, badge: null }] },
      {
        head: 'Changes',
        entries: [
          { screen: 'publish', label: 'Publish', count: null, badge: 7 },
          { screen: 'history', label: 'History', count: null, badge: null },
          { screen: 'nodes', label: 'Nodes', count: 3, badge: null },
        ],
      },
      {
        head: 'System',
        entries: [
          { href: '/admin/', label: 'Configuration' },
          { href: '/admin/test', label: 'Test authentication' },
          { href: '/admin/federation', label: 'Federation' },
        ],
      },
    ]);
  });

  it('leaves out the screens not served, the groups they empty, and the counts not given', () => {
    expect(navigation(['service-providers', 'publish'], {}, 0, null)).toEqual([
      { head: 'Entities', entries: [{ screen: 'service-providers', label: 'Service providers', count: null, badge: null }] },
      { head: 'Changes', entries: [{ screen: 'publish', label: 'Publish', count: null, badge: null }] },
    ]);
  });
});
