import type { HistoryPort, RollbackPlan, SnapshotList } from '../../../domain/publication';
import type { Failed } from '../../../lib/result';

// The HistorySnapshots board.
export const boardSnapshots: SnapshotList = {
  current: 41,
  retention: 10,
  snapshots: [
    { number: 41, createdAt: '2026-11-22T14:10:00', createdBy: 'admin', comment: 'Autumn onboarding: travel and library', changes: 7 },
    { number: 40, createdAt: '2026-11-14T10:02:00', createdBy: 'admin', comment: 'Moodle attributes', changes: 1 },
    { number: 39, createdAt: '2026-11-09T16:44:00', createdBy: 'admin', comment: null, changes: 3 },
    { number: 38, createdAt: '2026-11-02T09:15:00', createdBy: 'admin', comment: 'Rotate default-sp key', changes: 2 },
    { number: 37, createdAt: '2026-10-28T11:30:00', createdBy: 'admin', comment: 'Add HR self-service', changes: 1 },
  ],
};

const CATALOGUE = 'catalogue.library.example.edu/Shibboleth.sso/SAML2/POST';

// The Rollback board.
export const boardPlan: RollbackPlan = {
  target: 40,
  current: 41,
  more: 5,
  missingModules: [],
  broken: null,
  objects: [
    {
      name: 'Library catalogue',
      kind: 'Service provider',
      fate: null,
      lines: [
        { kind: 'same', text: "        'Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST'," },
        { kind: 'del', text: `        'Location' => 'https://${CATALOGUE}',` },
        { kind: 'add', text: `        'Location' => 'http://${CATALOGUE}',` },
        { kind: 'del', text: "'validate.authnrequest' => true," },
      ],
    },
    {
      name: 'Travel booking',
      kind: 'Service provider',
      fate: 'removed',
      lines: [
        { kind: 'del', text: "'entityid' => 'https://sso.travelbooker.example.com/saml2/metadata/7f3a9c21'," },
        { kind: 'del', text: '… 8 more options' },
      ],
    },
  ],
};

export interface MemoryHistory {
  list?: SnapshotList;
  plan?: Partial<RollbackPlan>;
  failure?: Failed;
  pending?: boolean;
  // What the confirming request answers: success when not given, 'pending' never answers, 'moved' a lost race.
  rollback?: Failed | 'pending' | 'moved';
}

const never = () => new Promise<never>(() => undefined);

export function memoryHistory({ list = boardSnapshots, plan = {}, failure, pending, rollback }: MemoryHistory = {}): HistoryPort {
  let current = { ...boardPlan, ...plan };

  return {
    snapshots: async () => (pending ? never() : failure ? { ok: false, ...failure } : { ok: true, data: list }),
    plan: async (target) => (pending ? never() : failure ? { ok: false, ...failure } : { ok: true, data: { ...current, target } }),
    rollBack: async () => {
      if (rollback === 'pending') {
        return never();
      }
      if (rollback === 'moved') {
        current = { ...current, current: current.current + 1 };

        return { ok: false, status: 409, body: null };
      }

      return rollback ? { ok: false, ...rollback } : { ok: true, data: {} };
    },
  };
}
