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
