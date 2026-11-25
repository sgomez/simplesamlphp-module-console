import type { EntityLabel, EntityRow } from '../../../domain/entities';

export function row(entityId: string, more: Partial<EntityRow> = {}): EntityRow {
  return { entityId, name: null, state: 'Up to date', labels: [], unreadable: false, error: null, ...more };
}

export const disabled: EntityLabel = { text: 'Disabled', kind: 'disabled', title: null };

export function warning(text: string, title: string): EntityLabel {
  return { text, kind: 'warning', title };
}

// The twelve rows of the ServiceProviders board.
export const boardRows: EntityRow[] = [
  row('https://evaluations.example.edu/saml/metadata', { name: 'Course evaluations' }),
  row('https://hr.example.edu/sp', { name: 'HR self-service' }),
  row('https://catalogue.library.example.edu/shibboleth', {
    name: 'Library catalogue',
    state: 'Modified',
    labels: [warning('Signing off', 'Responses are not signed.')],
  }),
  row('https://moodle.example.edu/auth/saml2/sp/metadata.php', {
    name: 'Moodle',
    labels: [warning('Certificate expires in 12 days', 'The signing certificate expires on 7 December 2026.')],
  }),
  row('https://intranet-old.example.edu/simplesaml/module.php/saml/sp/metadata.php/default-sp', {
    name: 'Old intranet',
    state: 'Modified',
    labels: [disabled],
  }),
  row('https://print.example.edu/saml2/service-provider-metadata/campus', { name: 'Print service' }),
  row('https://wiki.research.example.edu/saml/metadata', { name: 'Research wiki' }),
  row('https://rooms.example.edu/Shibboleth.sso/Metadata', { name: 'Room booking' }),
  row('https://records.example.edu/sso/saml2/metadata', { name: 'Student records' }),
  row('https://sso.travelbooker.example.com/saml2/metadata/7f3a9c21', { name: 'Travel booking', state: 'Unpublished' }),
  row('https://video.example.edu/sp/metadata.xml', { name: 'Video platform' }),
  row('https://onboard.net.example.edu/sp', { name: 'Wi-Fi onboarding' }),
];

// The board's 42 service providers: its twelve, then thirty more that sort after them.
export const boardList: EntityRow[] = [
  ...boardRows,
  ...Array.from({ length: 30 }, (_, n) => {
    const at = String(n + 1).padStart(2, '0');

    return row(`https://workspace-${at}.example.edu/sp`, { name: `Workspace ${at}` });
  }),
];
