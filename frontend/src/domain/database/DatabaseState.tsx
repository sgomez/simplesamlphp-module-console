import { PendingMigrations } from './PendingMigrations';
import { ConsoleOlder, SqliteTooOld, Unreachable } from './StateCards';
import type { DatabaseRefusal, MigrationRun } from './types';
import type { Settle } from './useMigrate';

interface DatabaseStateProps {
  refusal: DatabaseRefusal;
  // The run whose outcome a callout above shows.
  run: MigrationRun | null;
  settle: Settle;
  onRun: (run: MigrationRun) => void;
}

// The page of a database that is not ready (SPEC 10.5), in place of the requested screen.
export function DatabaseState({ refusal, run, settle, onRun }: DatabaseStateProps) {
  const flush = run !== null;
  switch (refusal.state) {
    case 'Unreachable':
      return <Unreachable refusal={refusal} flush={flush} />;
    case 'SqliteTooOld':
      return <SqliteTooOld refusal={refusal} flush={flush} />;
    case 'ConsoleOlder':
      return <ConsoleOlder refusal={refusal} flush={flush} />;
    case 'MigrationsPending':
      return (
        <PendingMigrations
          refusal={refusal}
          flush={flush}
          failedAt={run?.outcome === 'Failed' ? (run.failed?.number ?? null) : null}
          settle={settle}
          onRun={onRun}
        />
      );
  }
}
