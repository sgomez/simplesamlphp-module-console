import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import { Button } from '../../design-system/Button';
import { cx } from '../../design-system/classes';
import { Eid } from '../../design-system/Eid';
import { ChevronIcon } from '../../design-system/icons';
import { Row } from '../../design-system/Row';
import { Status } from '../../design-system/Status';
import { isDisabled, notesOf } from './notes';
import { editPath } from './routes';
import type { EntityRow } from './types';
import { useDeleteEntity } from './useDeleteEntity';

function RowNote({ row }: { row: EntityRow }) {
  const [first, ...rest] = notesOf(row);
  const more = row.error ?? (rest.length > 0 ? `+${rest.length} more` : null);
  if (first === undefined) {
    return null;
  }

  return (
    <div className="row-note">
      <Status tone={first.tone} mark={first.mark} {...(first.title === undefined ? {} : { title: first.title })}>
        {first.text}
      </Status>
      {more !== null && <span className={cx('xs faint row-more', row.error === null && 'at-wide')}>{more}</span>}
    </div>
  );
}

// Deleting it keeps the admin on the page and search the list is at; a failure shows below the row.
function UnreadableRow({ row, children }: { row: EntityRow; children: ReactNode }) {
  const { pathname, search } = useLocation();
  const deletion = useDeleteEntity(row, pathname + search);

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

export function EntityListRow({ row }: { row: EntityRow }) {
  const content = (
    <>
      <div className="row-main">
        {row.name !== null && <span className={cx('row-name', isDisabled(row) && 'is-off')}>{row.name}</span>}
        <Eid id={row.entityId} />
      </div>
      <RowNote row={row} />
    </>
  );
  if (row.unreadable) {
    return <UnreadableRow row={row}>{content}</UnreadableRow>;
  }

  return (
    <Row wrap to={editPath(row.entityId)}>
      {content}
      <ChevronIcon />
    </Row>
  );
}
