import type { EntitySet } from '../../../domain/entities';
import type { ExternalCopy, ExternalRow } from '../../../domain/overrides';

// One entry of metadata.sources, with every entity it holds for each set.
export interface SourceFixture {
  heading: string;
  location: string;
  importable: boolean;
  error?: string;
  sets: Partial<Record<EntitySet, ExternalRow[]>>;
}

function entity(entityId: string, name: string, more: Partial<ExternalRow> = {}): ExternalRow {
  return { entityId, name, managed: false, expired: null, ...more };
}

function filler(count: number, name: (at: string) => string, id: (at: string) => string): ExternalRow[] {
  return Array.from({ length: count }, (_, n) => {
    const at = String(n + 1).padStart(4, '0');

    return entity(id(at), name(at));
  });
}

const FEED = 'https://mds.federation.example.org';

// The External board: a federation feed of 2,941 service providers and a file of 12.
export const boardSources: SourceFixture[] = [
  {
    heading: 'Federation feed',
    location: `metarefresh · ${FEED}/sp.xml`,
    importable: true,
    sets: {
      'saml20-sp-remote': [
        entity('https://alumni.partner.example.org/saml/metadata', 'Alumni portal'),
        entity('https://card.example.edu/sp', 'Campus card', { managed: true }),
        entity('https://journals.publisher.example.com/shibboleth', 'E-journals'),
        entity('https://grid.research.example.net/sp/metadata', 'Grid computing', { expired: '2026-11-03T00:00:00' }),
        entity('https://labs.partner.example.org/Shibboleth.sso/Metadata', 'Lab booking'),
        entity('https://meet.vendor.example.com/saml2/sp', 'Video conferencing'),
        ...filler(2935, (at) => `Workspace ${at}`, (at) => `https://workspace-${at}.partner.example.org/sp`),
      ],
      'saml20-idp-remote': [
        entity('https://idp.partner.example.org/idp/shibboleth', 'Partner university'),
        entity('https://login.research.example.net/saml2/idp/metadata.php', 'Research institute'),
      ],
    },
  },
  {
    heading: 'File',
    location: 'metadata/saml20-sp-remote.php',
    importable: false,
    sets: {
      'saml20-sp-remote': [
        entity('https://intranet-old.example.edu/simplesaml/module.php/saml/sp/metadata.php/default-sp', 'Old intranet', { managed: true }),
        entity('https://timetable.example.edu/sp', 'Timetable'),
        ...filler(10, (at) => `Visitor desk ${at}`, (at) => `https://visitor-${at}.example.edu/sp`),
      ],
    },
  },
];

const BINDING = 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST';

// The ExternalDetail board's copy, as core receives it.
export const boardPhp = `$metadata['https://journals.publisher.example.com/shibboleth'] = [
    'name' => ['en' => 'E-journals'],
    'AssertionConsumerService' => [
        [
            'Binding' => '${BINDING}',
            'Location' => 'https://journals.publisher.example.com/Shibboleth.sso/SAML2/POST',
        ],
    ],
    'attributes' => ['eduPersonScopedAffiliation', 'eduPersonEntitlement'],
    'certData' => 'MIIDQjCCAiqgAwIBAgIUJ8s…',
    'expire' => 1798675200,
];`;

export function phpOf(row: ExternalRow): string {
  if (row.entityId === 'https://journals.publisher.example.com/shibboleth') {
    return boardPhp;
  }

  return `$metadata['${row.entityId}'] = [\n    'name' => ['en' => '${row.name ?? ''}'],\n];`;
}

// Every copy the sources hold, in source order; the node serves the first.
export function copiesOf(sources: SourceFixture[], set: EntitySet, entityId: string): { name: string | null; copies: ExternalCopy[] } {
  let name: string | null = null;
  const copies: ExternalCopy[] = [];
  sources.forEach((source, position) => {
    const row = source.error === undefined ? source.sets[set]?.find((one) => one.entityId === entityId) : undefined;
    if (row) {
      name ??= row.name;
      copies.push({ position, heading: source.heading, location: source.location, served: copies.length === 0, php: phpOf(row) });
    }
  });

  return { name, copies };
}
