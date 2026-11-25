export interface SessionLinks {
  identity: string;
  adminUrl: string;
  logoutUrl: string;
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
