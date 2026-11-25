import type { MigrationRun } from '../api/types';
import { Callout } from '../components/ui/Callout';

export function RunMessage({ run }: { run: MigrationRun }) {
  switch (run.outcome) {
    case 'Failed':
      return (
        <Callout
          kind="error"
          title={run.failed ? `Migration ${run.failed.number} failed: ${run.failed.title}` : 'Migrations failed'}
        >
          <span className="mono wrap-any">{run.reason}</span>
        </Callout>
      );
    case 'Concurrent':
      return <Callout kind="warning" title={run.reason ?? ''} />;
    case 'Applied':
      return run.applied.length === 0 ? (
        <Callout kind="info" title="The database schema is already up to date." />
      ) : (
        <Callout kind="success" title={`Migrations applied: ${run.applied.join(', ')}.`} />
      );
  }
}

// The one-shot message of a POST: the outcome of Run migrations, or a text such as "Deleted.".
export function OutcomeMessage({ said }: { said: MigrationRun | string }) {
  return typeof said === 'string' ? <Callout kind="success" title={said} /> : <RunMessage run={said} />;
}
