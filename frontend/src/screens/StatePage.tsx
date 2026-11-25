import { Fragment, type ReactNode } from 'react';
import type { DatabaseRefusal, MigrationRun } from '../api/types';
import { Button } from '../components/ui/Button';
import { Callout } from '../components/ui/Callout';
import { Card } from '../components/ui/Card';
import { Row } from '../components/ui/Row';
import { Status } from '../components/ui/Status';
import { cx } from '../components/ui/classes';

const PACKAGE = 'sgomez/simplesamlphp-module-console';

const titles: Record<DatabaseRefusal['state'], string> = {
  Unreachable: 'Database unreachable',
  SqliteTooOld: 'SQLite too old',
  ConsoleOlder: 'Console older than the database',
  MigrationsPending: 'Database update',
};

export function stateCrumb(refusal: DatabaseRefusal): string {
  return titles[refusal.state];
}

function StateCard({ offset = true, children }: { offset?: boolean; children: ReactNode }) {
  return <div className={cx('card empty', offset && 'state-card')}>{children}</div>;
}

function Facts({ facts }: { facts: [string, ReactNode, string?][] }) {
  return (
    <dl className="facts">
      {facts.map(([term, value, className]) => (
        <Fragment key={term}>
          <dt className="muted">{term}</dt>
          <dd className={className}>{value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

interface PendingProps {
  refusal: DatabaseRefusal;
  failure: MigrationRun | null;
  running: boolean;
  onUpdate: () => void;
}

function Pending({ refusal, failure, running, onUpdate }: PendingProps) {
  const count = refusal.missing.length;
  const failedAt = failure?.failed?.number;

  return (
    <>
      {failure && (
        <Callout
          kind="error"
          title={failure.failed ? `Migration ${failure.failed.number} failed: ${failure.failed.title}` : 'Migrations failed'}
        >
          <span className="mono wrap-any">{failure.reason}</span>
        </Callout>
      )}
      <StateCard offset={!failure}>
        <h1 className="h1">The database needs an update</h1>
        <p className="muted empty-text">A migration cannot be undone without restoring a backup. Sign-in is not affected.</p>
        <Button variant="primary" loading={running} disabled={running} onClick={onUpdate}>
          Update database
        </Button>
      </StateCard>
      <div className="section-head">
        <h2 className="h2">{`${count} ${count === 1 ? 'migration' : 'migrations'} to apply`}</h2>
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

export function StatePage(props: PendingProps) {
  const { refusal } = props;
  switch (refusal.state) {
    case 'Unreachable':
      return (
        <StateCard>
          <h1 className="h1">Database unreachable</h1>
          <p className="muted empty-text">The Console cannot reach its database. Nodes keep serving their local Snapshot.</p>
          {refusal.detail && (
            <details className="grp">
              <summary>
                <span className="small">Technical detail</span>
              </summary>
              <pre className="code" tabIndex={0} aria-label="Technical detail">
                {refusal.detail}
              </pre>
            </details>
          )}
        </StateCard>
      );
    case 'SqliteTooOld':
      return (
        <StateCard>
          <h1 className="h1">SQLite too old</h1>
          <Facts
            facts={[
              ['Found', refusal.sqliteVersion, 'mono is-strong'],
              ['Minimum', refusal.sqliteMinimum, 'mono'],
            ]}
          />
        </StateCard>
      );
    case 'ConsoleOlder':
      return (
        <StateCard>
          <h1 className="h1">Console older than the database</h1>
          <Facts
            facts={[
              ['This Console knows', `Schema ${refusal.known}`],
              ['The database holds', `Schema ${refusal.highest}`, 'is-strong'],
            ]}
          />
          <p className="muted empty-text">
            Update <span className="mono">{PACKAGE}</span> on this node.
          </p>
        </StateCard>
      );
    case 'MigrationsPending':
      return <Pending {...props} />;
  }
}
