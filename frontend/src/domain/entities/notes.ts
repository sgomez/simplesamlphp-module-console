import type { StatusMark, StatusTone } from '../../design-system/Status';
import type { EntityRow } from './types';

export interface Note {
  tone: StatusTone;
  mark: StatusMark;
  text: string;
  title?: string;
}

const cycle: Record<string, Note> = {
  Unpublished: { tone: 'pending', mark: 'dot', text: 'New, not published' },
  Modified: { tone: 'pending', mark: 'half', text: 'Modified, not live' },
};

const order: Partial<Record<StatusTone, number>> = { danger: 0, warn: 2 };

function rank(note: Note): number {
  return order[note.tone] ?? 1;
}

export function isDisabled(row: EntityRow): boolean {
  return row.labels.some((label) => label.kind === 'disabled');
}

// The server sends disabled as a label: with a Pending change it is To be withdrawn, without one Not live.
function stateOf(row: EntityRow): Note | undefined {
  const pending = row.state === null ? undefined : cycle[row.state];
  if (isDisabled(row)) {
    return pending ? { tone: 'pending', mark: 'minus', text: 'Disabled, not published' } : { tone: 'off', mark: 'minus', text: 'Disabled' };
  }

  return pending;
}

// One line per row: Unreadable and errors, then the state, then warnings; the rest is counted.
export function notesOf(row: EntityRow): Note[] {
  const notes: Note[] = [];
  const state = row.unreadable ? { tone: 'danger', mark: 'full', text: 'Unreadable' } as const : stateOf(row);
  if (state) {
    notes.push(state);
  }
  for (const label of row.labels) {
    const title = label.title === null ? {} : { title: label.title };
    if (label.kind === 'error') {
      notes.push({ tone: 'danger', mark: 'full', text: label.text, ...title });
    } else if (label.kind === 'warning') {
      notes.push({ tone: 'warn', mark: 'warning', text: label.text, ...title });
    }
  }

  return notes.sort((a, b) => rank(a) - rank(b));
}
