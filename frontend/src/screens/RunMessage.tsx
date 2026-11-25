import type { MigrationRun } from '../domain/database';
import type { Said } from '../app/Page';
import { Callout } from '../design-system/Callout';

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

export function runOf(said: Said | null): MigrationRun | null {
  return said === null || typeof said === 'string' || 'created' in said ? null : said;
}

// The one-shot message of a POST at the top of the page; a created entity's edit screen says it is saved itself.
export function OutcomeMessage({ said }: { said: Said }) {
  if (typeof said === 'string') {
    return <Callout kind="success" title={said} />;
  }
  const run = runOf(said);

  return run && <RunMessage run={run} />;
}
