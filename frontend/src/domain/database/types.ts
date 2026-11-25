// Core's admin pages, which the sidebar's System group leaves for.
export interface CoreLinks {
  configuration: string;
  test: string;
  federation: string;
}

export interface SessionLinks {
  identity: string;
  core: CoreLinks;
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
  // SPEC 10.5; the 503 body does not carry them yet.
  moduleVersion?: string;
  snapshot?: number;
}

export interface MigrationRun {
  outcome: 'Applied' | 'Concurrent' | 'Failed';
  applied: number[];
  failed: Migration | null;
  reason: string | null;
}
