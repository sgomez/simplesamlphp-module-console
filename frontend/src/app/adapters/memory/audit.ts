import type { AuditEntry, AuditPort, AuditQuery } from '../../../domain/audit';
import type { Failed } from '../../../lib/result';

const sp = (name: string) => ({ type: 'object', name, kind: 'Service provider' }) as const;
const plain = { diff: null, document: null, raw: false } as const;

// The Audit board.
export const boardEntries: AuditEntry[] = [
  {
    id: 214,
    at: '2026-11-24T09:02:00',
    identity: 'admin',
    action: 'edit',
    subject: sp('Moodle'),
    diff: [
      { kind: 'same', text: "  'attributes' => ['uid', 'mail', 'displayName'," },
      { kind: 'add', text: "    'eduPersonAffiliation'," },
      { kind: 'same', text: '  ],' },
    ],
    document: "$metadata['https://moodle.example.edu/sp'] = [\n  'attributes' => ['uid', 'mail', 'displayName',\n    'eduPersonAffiliation',\n  ],\n];",
    raw: false,
  },
  {
    id: 213,
    at: '2026-11-23T17:40:00',
    identity: 'admin',
    action: 'edit',
    subject: { type: 'object', name: 'default-sp', kind: 'Authsource · saml:SP' },
    diff: [{ kind: 'sec', text: "'privatekey_pass'  secret changed, value not shown" }],
    document: null,
    raw: false,
  },
  { id: 212, at: '2026-11-23T17:31:00', identity: 'admin', action: 'disable', subject: sp('Old intranet'), ...plain },
  {
    id: 211,
    at: '2026-11-22T14:10:00',
    identity: 'admin',
    action: 'publish',
    subject: { type: 'snapshot', from: 40, to: 41, comment: 'Autumn onboarding: travel and library', changes: 7 },
    ...plain,
  },
  { id: 210, at: '2026-11-22T13:58:00', identity: 'admin', action: 'edit', subject: sp('Travel booking'), ...plain },
  {
    id: 209,
    at: '2026-11-22T11:20:00',
    identity: 'admin',
    action: 'delete',
    subject: { type: 'object', name: 'legacy-radius', kind: 'Authsource · sqlauth:SQL2' },
    ...plain,
  },
];

// The board's 214 rows: its six, then older saves.
export const boardTrail: AuditEntry[] = [
  ...boardEntries,
  ...Array.from({ length: 208 }, (_, n): AuditEntry => {
    const at = new Date(Date.UTC(2026, 10, 21, 18) - n * 3600 * 1000).toISOString().slice(0, 19);

    return { id: 208 - n, at, identity: 'admin', action: 'edit', subject: sp(`Service ${208 - n}`), ...plain };
  }),
];

function matches({ object, action, from, to }: AuditQuery): (entry: AuditEntry) => boolean {
  return (entry) => {
    const day = entry.at.slice(0, 10);
    const name = entry.subject.type === 'object' ? entry.subject.name : '';

    return (
      name.toLowerCase().includes(object.toLowerCase()) &&
      (action === null || entry.action === action) &&
      (from === '' || day >= from) &&
      (to === '' || day <= to)
    );
  };
}

export interface MemoryAudit {
  entries?: AuditEntry[];
  perPage?: number;
  anonymous?: boolean;
  failure?: Failed;
}

export function memoryAudit({ entries = boardTrail, perPage = 6, anonymous = true, failure }: MemoryAudit = {}): AuditPort {
  return {
    trail: async (query) => {
      if (failure) {
        return { ok: false, ...failure };
      }
      const found = entries.filter(matches(query));
      const pages = Math.ceil(found.length / perPage);
      const page = Math.min(query.page, Math.max(pages, 1));

      return {
        ok: true,
        data: { entries: found.slice((page - 1) * perPage, page * perPage), total: found.length, page, pages, perPage, anonymous },
      };
    },
  };
}
