import type { Attention, Overview, OverviewPort } from '../../../domain/overview';
import type { Failed } from '../../../lib/result';

// The OverviewClear board: nothing needs attention, Snapshot #42 live.
export const boardOverview: Overview = {
  attention: [],
  current: { number: 42, createdAt: '2026-11-24T09:12:00', createdBy: 'admin', comment: null },
  counts: { 'saml20-sp-remote': 42, 'saml20-idp-remote': 6, 'saml20-idp-hosted': 1, authsources: 5 },
};

// The OverviewFirstRun board.
export const firstRun: Overview = {
  attention: [],
  current: null,
  counts: { 'saml20-sp-remote': 0, 'saml20-idp-remote': 0, 'saml20-idp-hosted': 0, authsources: 0 },
};

export interface MemoryOverview {
  overview?: Overview;
  failure?: Failed;
}

export function memoryOverview({ overview = boardOverview, failure }: MemoryOverview = {}): OverviewPort {
  return {
    overview: async () => (failure ? { ok: false, ...failure } : { ok: true, data: overview }),
  };
}

const SP = 'saml20-sp-remote';

// One line of each kind Needs attention words.
export const attention: Attention[] = [
  { kind: 'pending', count: 7 },
  { kind: 'node', node: 'idp-2', problem: 'behind', by: 2 },
  { kind: 'node', node: 'idp-3', problem: 'silent', minutes: 12 },
  { kind: 'node', node: 'idp-1', problem: 'flagged' },
  { kind: 'certificate', set: SP, entityId: 'https://moodle.example.edu/auth/saml2/sp/metadata.php', name: 'Moodle', days: 12 },
  { kind: 'certificate', set: 'saml20-idp-remote', entityId: 'https://login.hospital.example.org/adfs/services/trust', name: null, days: -3 },
  { kind: 'override', set: SP, entityId: 'https://catalogue.library.example.edu/shibboleth', name: 'Library catalogue', reviewed: true },
  { kind: 'override', set: SP, entityId: 'https://card.example.edu/sp', name: 'Campus card', reviewed: false },
  { kind: 'unlisted' },
];
