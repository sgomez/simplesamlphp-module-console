import { createContext, useContext } from 'react';
import type { DiffLine } from '../../design-system/Diff';
import type { Result } from '../../lib/result';

export type AuditAction =
  | 'create'
  | 'edit'
  | 'delete'
  | 'enable'
  | 'disable'
  | 'discard'
  | 'import'
  | 'reviewed'
  | 'publish'
  | 'rollback'
  | 'migrate';

export type AuditSubject =
  | { type: 'object'; name: string; kind: string }
  | { type: 'snapshot'; from: number | null; to: number; comment: string | null; changes: number | null }
  | { type: 'schema'; version: number };

// A row of the Audit trail (SPEC 4.4).
export interface AuditEntry {
  id: number;
  at: string;
  identity: string;
  action: AuditAction;
  subject: AuditSubject;
  // Against the previous row of the same object, sensitive values as markers; null when there is none to show.
  diff: DiffLine[] | null;
  // The document after the change: PHP text, or raw JSON when it can no longer be translated.
  document: string | null;
  raw: boolean;
}

export interface AuditQuery {
  object: string;
  action: AuditAction | null;
  from: string;
  to: string;
  page: number;
}

export interface AuditPage {
  entries: AuditEntry[];
  total: number;
  page: number;
  pages: number;
  perPage: number;
  // The session's identity is the constant `admin` (SPEC 8.7).
  anonymous: boolean;
}

export interface AuditPort {
  trail(query: AuditQuery): Promise<Result<AuditPage>>;
}

const unset = async () => ({ ok: false, status: 0, body: null }) as const;

export const AuditPortContext = createContext<AuditPort>({ trail: unset });

export function useAuditPort(): AuditPort {
  return useContext(AuditPortContext);
}
