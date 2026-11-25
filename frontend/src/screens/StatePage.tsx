import { useState } from 'react';
import { postJson } from '../api/client';
import { API } from '../api/paths';
import type { DatabaseRefusal, MigrationRun } from '../api/types';
import { plural } from '../app/counts';
import { failureText, useSettle } from '../app/settle';
import { Button } from '../components/ui/Button';
import { Callout } from '../components/ui/Callout';
import { Card } from '../components/ui/Card';
import { Pre } from '../components/ui/Code';
import { Disclosure } from '../components/ui/Disclosure';
import { Empty } from '../components/ui/Empty';
import { Facts } from '../components/ui/Facts';
import { Row } from '../components/ui/Row';
import { Status } from '../components/ui/Status';

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

interface StatePageProps {
  refusal: DatabaseRefusal;
  // A callout sits above the card and takes the place of its offset.
  flush: boolean;
  // The migration a failed run stopped at.
  failedAt: number | null;
  onRun: (run: MigrationRun) => void;
}

function Pending({ refusal, flush, failedAt, onRun }: StatePageProps) {
  const [running, setRunning] = useState(false);
  // A run the server did not carry out: no answer, or one that is not a run.
  const [failed, setFailed] = useState<number | null>(null);
  const settle = useSettle();

  const update = () => {
    setRunning(true);
    setFailed(null);
    void postJson<MigrationRun>(API.migrate, {}).then((result) => {
      setRunning(false);
      if (result.ok) {
        onRun(result.data);
      } else {
        settle(result, setFailed);
      }
    });
  };

  return (
    <>
      {failed !== null && <Callout kind="error" title={failureText('Migrations not run', failed)} />}
      <Empty
        state
        flush={flush || failed !== null}
        title="The database needs an update"
        text="A migration cannot be undone without restoring a backup. Sign-in is not affected."
        actions={
          <Button variant="primary" loading={running} disabled={running} onClick={update}>
            Update database
          </Button>
        }
      />
      <div className="section-head">
        <h2 className="h2">{`${plural(refusal.missing.length, 'migration', 'migrations')} to apply`}</h2>
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

export function StatePage(props: StatePageProps) {
  const { refusal, flush } = props;
  switch (refusal.state) {
    case 'Unreachable':
      return (
        <Empty
          state
          flush={flush}
          title="Database unreachable"
          text="The Console cannot reach its database. Nodes keep serving their local Snapshot."
        >
          {refusal.detail && (
            <Disclosure summary="Technical detail">
              <Pre label="Technical detail">{refusal.detail}</Pre>
            </Disclosure>
          )}
        </Empty>
      );
    case 'SqliteTooOld':
      return (
        <Empty state flush={flush} title="SQLite too old">
          <Facts
            facts={[
              { term: 'Found', value: refusal.sqliteVersion, className: 'mono is-strong' },
              { term: 'Minimum', value: refusal.sqliteMinimum, className: 'mono' },
            ]}
          />
        </Empty>
      );
    case 'ConsoleOlder':
      return (
        <Empty state flush={flush} title="Console older than the database">
          <Facts
            facts={[
              { term: 'This Console knows', value: `Schema ${refusal.known}` },
              { term: 'The database holds', value: `Schema ${refusal.highest}`, className: 'is-strong' },
            ]}
          />
          <p className="muted empty-text">
            Update <span className="mono">{PACKAGE}</span> on this node.
          </p>
        </Empty>
      );
    case 'MigrationsPending':
      return <Pending {...props} />;
  }
}
