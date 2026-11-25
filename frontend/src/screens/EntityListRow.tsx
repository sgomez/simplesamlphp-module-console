import type { EntityRow } from '../api/types';
import { cx } from '../components/ui/classes';
import { Eid } from '../components/ui/Eid';
import { ChevronIcon } from '../components/ui/icons';
import { Row } from '../components/ui/Row';
import { Status, type StatusMark, type StatusTone } from '../components/ui/Status';

interface Note {
  tone: StatusTone;
  mark: StatusMark;
  text: string;
  title?: string;
}

const cycle: Record<string, Omit<Note, 'text'>> = {
  Unpublished: { tone: 'pending', mark: 'dot' },
  Modified: { tone: 'pending', mark: 'half' },
};

// One line per row: Unreadable and the publish cycle first, then warnings; the rest is counted.
function notesOf(row: EntityRow): Note[] {
  const notes: Note[] = [];
  const state = row.state === null ? undefined : cycle[row.state];
  if (row.unreadable) {
    notes.push({ tone: 'danger', mark: 'full', text: 'Unreadable' });
  } else if (state && row.state !== null) {
    notes.push({ ...state, text: row.state });
  }
  for (const label of row.labels) {
    notes.push(
      label.kind === 'disabled'
        ? { tone: 'pending', mark: 'minus', text: label.text }
        : { tone: 'warn', mark: 'warning', text: label.text, ...(label.title === null ? {} : { title: label.title }) },
    );
  }

  return notes.sort((a, b) => Number(a.tone === 'warn') - Number(b.tone === 'warn'));
}

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
      {more !== null && <span className="xs faint row-more">{more}</span>}
    </div>
  );
}

export function EntityListRow({ row, editPath }: { row: EntityRow; editPath: string }) {
  const off = row.labels.some((label) => label.kind === 'disabled');
  const content = (
    <>
      <div className="row-main">
        {row.name !== null && <span className={cx('row-name', off && 'is-off')}>{row.name}</span>}
        <Eid id={row.entityId} />
      </div>
      <RowNote row={row} />
    </>
  );
  if (row.unreadable) {
    return (
      <Row wrap plain>
        {content}
      </Row>
    );
  }

  return (
    <Row wrap to={`${editPath}?entityid=${encodeURIComponent(row.entityId)}`}>
      {content}
      <ChevronIcon />
    </Row>
  );
}
