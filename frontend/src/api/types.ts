export interface SessionLinks {
  identity: string;
  adminUrl: string;
  logoutUrl: string;
}

export interface Session extends SessionLinks {
  pendingCount: number;
}

export interface Migration {
  number: number;
  title: string;
}

// The 503 of every API route while the database is not ready.
export interface DatabaseRefusal {
  state: 'Unreachable' | 'SqliteTooOld' | 'ConsoleOlder' | 'MigrationsPending';
  known: number;
  highest: number;
  missing: Migration[];
  sqliteVersion: string | null;
  sqliteMinimum: string;
  detail: string | null;
  session: SessionLinks;
}

export interface MigrationRun {
  outcome: 'Applied' | 'Concurrent' | 'Failed';
  applied: number[];
  failed: Migration | null;
  reason: string | null;
}

export interface EntityLabel {
  text: string;
  kind: 'disabled' | 'warning';
  title: string | null;
}

export interface EntityRow {
  entityId: string;
  name: string | null;
  state: string | null;
  labels: EntityLabel[];
  unreadable: boolean;
  error: string | null;
}

export interface EntityPage {
  rows: EntityRow[];
  total: number;
  page: number;
  pages: number;
  perPage: number;
  query: string;
}

export interface EntityWarning {
  label: string;
  message: string;
}

export interface EntityNotice {
  message: string;
  option: string | null;
  line: number | null;
}

export interface EntityError {
  pointer: string;
  message: string;
  line: number | null;
  column: number | null;
}

// The object of the edit screen; an Unreadable row has no text.
export interface EditedEntity {
  entityId: string;
  name: string | null;
  version: number;
  state: string | null;
  unreadable: boolean;
  error: string | null;
  php: string | null;
  warnings: EntityWarning[];
  notices: EntityNotice[];
}

export interface Refusal {
  errors: EntityError[];
  notices: EntityNotice[];
  readable: boolean;
}

export interface Validation extends Refusal {
  warnings: EntityWarning[];
}
