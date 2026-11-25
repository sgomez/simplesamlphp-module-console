import { Button } from '../../design-system/Button';
import { Callout } from '../../design-system/Callout';
import { Card } from '../../design-system/Card';
import { Empty } from '../../design-system/Empty';
import { Row } from '../../design-system/Row';
import { Status } from '../../design-system/Status';
import { failureText } from '../../lib/failureText';
import { plural } from '../../lib/plural';
import type { DatabaseRefusal, MigrationRun } from './types';
import { useMigrate, type Settle } from './useMigrate';

interface PendingProps {
  refusal: DatabaseRefusal;
  flush: boolean;
  // The migration a failed run stopped at.
  failedAt: number | null;
  settle: Settle;
  onRun: (run: MigrationRun) => void;
}

function lead({ moduleVersion, snapshot }: DatabaseRefusal): string {
  return [
    moduleVersion !== undefined && `The module was upgraded to ${moduleVersion}.`,
    snapshot !== undefined && `Nodes keep serving Snapshot #${snapshot} meanwhile.`,
    'A migration cannot be undone without restoring a backup.',
  ]
    .filter(Boolean)
    .join(' ');
}

export function PendingMigrations({ refusal, flush, failedAt, settle, onRun }: PendingProps) {
  const { running, failed, update } = useMigrate(settle, onRun);
  const steps = refusal.missing.length;

  return (
    <>
      {failed !== null && <Callout kind="error" title={failureText('Migrations not run', failed)} />}
      <Empty state flush={flush || failed !== null} title="The database needs an update">
        <p className="muted state-text">{lead(refusal)}</p>
        <Button variant="primary" loading={running} disabled={running} onPress={update}>
          Update database
        </Button>
        <span className="small muted">{plural(steps, 'step', 'steps')}</span>
      </Empty>
      <div className="section-head">
        <h2 className="h2">{`${plural(steps, 'migration', 'migrations')} to apply`}</h2>
      </div>
      <Card list>
        {refusal.missing.map((migration) => (
          <Row plain key={migration.number}>
            <span className="mono faint">{migration.number}</span>
            <span className="row-main">{migration.title}</span>
            {migration.number === failedAt && (
              <Status tone="danger" mark="error">
                Failed
              </Status>
            )}
          </Row>
        ))}
      </Card>
    </>
  );
}
