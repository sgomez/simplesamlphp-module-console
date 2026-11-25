import { changeCount } from './counts';
import type { ChangeGroup, ChangeState, PublicationReview } from './types';

interface Label {
  sign: string;
  verb: string;
  // In the text of "Discard all".
  word: string;
}

// SPEC 10.8 and 10.14, in the order Publish groups them.
export const LABELS: Record<ChangeState, Label> = {
  Modified: { sign: '~', verb: 'Modified', word: 'modified' },
  Unpublished: { sign: '+', verb: 'Added', word: 'new' },
  'To be withdrawn': { sign: '−', verb: 'Withdrawn', word: 'withdrawn' },
  Deleted: { sign: '×', verb: 'Deleted', word: 'deleted' },
  Unreadable: { sign: '!', verb: 'Unreadable', word: 'unreadable' },
};

const ORDER = Object.keys(LABELS);

export function ordered(groups: readonly ChangeGroup[]): ChangeGroup[] {
  return [...groups].sort((a, b) => ORDER.indexOf(a.state) - ORDER.indexOf(b.state));
}

function listed(parts: string[]): string {
  return parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1) ?? ''}`;
}

// "3 modified, 2 new and 1 deleted object go back": the noun agrees with the last count, the verb with all of them.
export function discardText(review: PublicationReview): string {
  const groups = ordered(review.groups);
  const last = groups.at(-1)?.changes.length ?? 0;
  const counts = listed(groups.map(({ state, changes }) => `${changes.length} ${LABELS[state].word}`));
  const since = review.current === null ? '' : ` since Snapshot #${review.current.number}`;
  const subject = `${counts} ${last === 1 ? 'object' : 'objects'}`;

  return `Every saved change${since} is removed: ${subject} ${changeCount(review) === 1 ? 'goes' : 'go'} back to what is live. This cannot be undone.`;
}
