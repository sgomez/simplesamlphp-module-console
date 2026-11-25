import type { DatabasePort, DatabaseRefusal, Migration, MigrationRun } from '../../../domain/database';
import type { Failed } from '../../../lib/result';
import { boardLinks } from './session';

export interface MemoryDatabase {
  run?: MigrationRun;
  failure?: Failed;
}

export const applied: MigrationRun = { outcome: 'Applied', applied: [7, 8, 9], failed: null, reason: null };

export function memoryDatabase({ run = applied, failure }: MemoryDatabase = {}): DatabasePort {
  return { migrate: async () => (failure ? { ok: false, ...failure } : { ok: true, data: run }) };
}

export const boardMigrations: Migration[] = [
  { number: 7, title: 'Create console_audit' },
  { number: 8, title: 'Create the index console_audit_entity' },
  { number: 9, title: 'Create the index console_audit_authsource' },
];

// The 503 body as the server answers it today, without the module version and the Snapshot.
export function servedRefusal(more: Partial<DatabaseRefusal> = {}): DatabaseRefusal {
  return {
    state: 'MigrationsPending',
    known: 9,
    highest: 6,
    missing: boardMigrations,
    sqliteVersion: null,
    sqliteMinimum: '3.24.0',
    detail: null,
    session: boardLinks,
    ...more,
  };
}

// The Migration board: module 1.4, Snapshot #41, three steps.
export function boardRefusal(more: Partial<DatabaseRefusal> = {}): DatabaseRefusal {
  return servedRefusal({ moduleVersion: '1.4', snapshot: 41, ...more });
}
