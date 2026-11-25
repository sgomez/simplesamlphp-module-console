import { Callout } from '../../design-system/Callout';
import type { MigrationRun } from './types';

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
