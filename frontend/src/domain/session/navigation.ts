import type { CoreLinks } from '../database';

export type Screen =
  | 'overview'
  | 'service-providers'
  | 'identity-providers'
  | 'hosted-idp'
  | 'external'
  | 'authsources'
  | 'publish'
  | 'history'
  | 'nodes';

// The number of objects a list holds, keyed as the server names the list.
export type Counts = Partial<Record<'saml20-sp-remote' | 'saml20-idp-remote' | 'external' | 'authsources' | 'nodes', number>>;

export type NavEntry =
  | { screen: Screen; label: string; count: number | null; badge: number | null }
  | { href: string; label: string };

export interface NavGroup {
  head: string | null;
  entries: NavEntry[];
}

type Plan = [Screen, string, keyof Counts | null];

const GROUPS: [string | null, Plan[]][] = [
  [null, [['overview', 'Overview', null]]],
  [
    'Entities',
    [
      ['service-providers', 'Service providers', 'saml20-sp-remote'],
      ['identity-providers', 'Identity providers', 'saml20-idp-remote'],
      ['hosted-idp', 'Hosted IdP', null],
      ['external', 'External entities', 'external'],
    ],
  ],
  ['Login', [['authsources', 'Authsources', 'authsources']]],
  [
    'Changes',
    [
      ['publish', 'Publish', null],
      ['history', 'History', null],
      ['nodes', 'Nodes', 'nodes'],
    ],
  ],
];

// The sidebar of SPEC 10.3: the screens served with their counts, the Pending changes on Publish, then core's pages.
export function navigation(screens: readonly Screen[], counts: Counts, pending: number, core: CoreLinks | null): NavGroup[] {
  const groups: NavGroup[] = GROUPS.map(([head, plans]) => ({
    head,
    entries: plans
      .filter(([screen]) => screens.includes(screen))
      .map(([screen, label, counted]) => ({
        screen,
        label,
        count: counted === null ? null : (counts[counted] ?? null),
        badge: screen === 'publish' && pending > 0 ? pending : null,
      })),
  }));
  if (core !== null) {
    groups.push({
      head: 'System',
      entries: [
        { href: core.configuration, label: 'Configuration' },
        { href: core.test, label: 'Test authentication' },
        { href: core.federation, label: 'Federation' },
      ],
    });
  }

  return groups.filter((group) => group.entries.length > 0);
}
