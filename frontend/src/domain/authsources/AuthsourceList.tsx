import type { ReactNode } from 'react';
import { Button } from '../../design-system/Button';
import { Card } from '../../design-system/Card';
import { Chip } from '../../design-system/Chip';
import { cx } from '../../design-system/classes';
import { Empty } from '../../design-system/Empty';
import { ChevronIcon } from '../../design-system/icons';
import { Row } from '../../design-system/Row';
import { Status } from '../../design-system/Status';
import { isDisabled, RowNote, useDeleteEntity } from '../entities';
import { AUTHSOURCES, authsourcePath, useAuthsourcesPort, type AuthsourceRow, type FileAuthsource } from './port';

function Named({ id, type, off = false }: { id: string; type: string; off?: boolean }) {
  return (
    <div className="row-main">
      <span className={cx('mono row-id', off && 'is-off')}>{id}</span>
      <span className="mono muted wrap-any">{type}</span>
    </div>
  );
}

function UnreadableRow({ row, children }: { row: AuthsourceRow; children: ReactNode }) {
  const deletion = useDeleteEntity({ entityId: row.id, name: null, inSnapshot: row.inSnapshot }, AUTHSOURCES, useAuthsourcesPort().remove);

  return (
    <>
      <Row wrap plain>
        {children}
        <div className="row-slot">
          <Button variant="danger" small onPress={deletion.ask}>
            Delete…
          </Button>
        </div>
      </Row>
      {deletion.element}
    </>
  );
}

function ManagedRow({ row }: { row: AuthsourceRow }) {
  const content = (
    <>
      <Named id={row.id} type={row.type} off={isDisabled(row)} />
      <RowNote row={row} />
    </>
  );
  if (row.unreadable) {
    return <UnreadableRow row={row}>{content}</UnreadableRow>;
  }

  return (
    <Row wrap to={authsourcePath(row.id)}>
      {content}
      <ChevronIcon />
    </Row>
  );
}

function FileRow({ row }: { row: FileAuthsource }) {
  return (
    <Row wrap plain>
      <Named id={row.id} type={row.type} />
      {row.shadows && (
        <div className="row-note">
          <Status tone="warn" mark="warning">
            Replaces the managed one with this id
          </Status>
        </div>
      )}
    </Row>
  );
}

// SPEC 10.8: the managed authsources, then the node's File authsources, read-only.
export function AuthsourceRows({ managed, file }: { managed: AuthsourceRow[]; file: FileAuthsource[] }) {
  return (
    <>
      {managed.length === 0 ? (
        <Empty title="No authsources yet" />
      ) : (
        <Card list>
          {managed.map((row) => (
            <ManagedRow key={row.id} row={row} />
          ))}
        </Card>
      )}
      {file.length > 0 && (
        <section className="sect sect-apart">
          <div className="sect-head">
            <h2 className="h2">From authsources.php</h2>
            <Chip>Read-only</Chip>
          </div>
          <Card list>
            {file.map((row) => (
              <FileRow key={row.id} row={row} />
            ))}
          </Card>
        </section>
      )}
    </>
  );
}
