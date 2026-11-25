import type { ReactNode } from 'react';
import { Button } from '../../../design-system/Button';
import { Callout } from '../../../design-system/Callout';
import { failureText } from '../../../lib/failureText';
import { plural } from '../../../lib/plural';
import type { SavedBy } from '../port';

// What the last save came to; null before any.
export type SaveOutcome =
  | { kind: 'saved'; tidied?: { comments: number } }
  | { kind: 'invalid'; count: number; readable: boolean }
  | { kind: 'race'; by?: SavedBy }
  | { kind: 'failed'; status: number }
  | null;

interface OutcomeProps {
  outcome: SaveOutcome;
  title: string;
  state: string | null;
  // The Review button, when the object has a Pending change to review.
  review: ReactNode;
  // Stops the tidied notice, when the port offers it.
  onHideTidied?: (() => void) | undefined;
  // Under a refusal, each error with a link to its field.
  items?: ReactNode[];
}

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'always' });

export function ago(at: Date, now = new Date()): string {
  const minutes = Math.round((now.getTime() - at.getTime()) / 60000);
  if (minutes < 1) {
    return 'a moment ago';
  }
  if (minutes < 60) {
    return relative.format(-minutes, 'minute');
  }

  return minutes < 1440 ? relative.format(-Math.round(minutes / 60), 'hour') : relative.format(-Math.round(minutes / 1440), 'day');
}

function tidiedTitle(comments: number): string {
  return comments === 0
    ? 'Formatting was tidied'
    : `Formatting was tidied and ${plural(comments, 'comment was', 'comments were')} removed`;
}

function Saved({ state, review, tidied, onHideTidied }: { state: string | null; review: ReactNode; tidied: { comments: number } | undefined; onHideTidied: (() => void) | undefined }) {
  const published = state === 'Up to date';

  return (
    <>
      <Callout kind="success" title={published ? 'Saved.' : 'Saved. Not live yet.'} action={!published && review} />
      {tidied && onHideTidied && (
        <Callout
          kind="info"
          title={tidiedTitle(tidied.comments)}
          action={
            <Button variant="quiet" small onPress={onHideTidied}>
              Do not show again
            </Button>
          }
        >
          This happens on every save.
        </Callout>
      )}
    </>
  );
}

export function Outcome({ outcome, title, state, review, onHideTidied, items }: OutcomeProps) {
  switch (outcome?.kind) {
    case 'saved':
      return <Saved state={state} review={review} tidied={outcome.tidied} onHideTidied={onHideTidied} />;
    case 'invalid':
      return outcome.readable ? (
        <Callout kind="error" title={`Not saved: ${plural(outcome.count, 'error', 'errors')}`} {...(items && items.length > 0 && { items })} />
      ) : (
        <Callout kind="error" title="Not saved: the text could not be read">
          Nothing else is checked until this is fixed.
        </Callout>
      );
    case 'race':
      return (
        <Callout kind="error" title={`Not saved: ${title} changed meanwhile`}>
          {outcome.by
            ? `${outcome.by.identity} saved it ${ago(outcome.by.at)}. Your edits were not kept.`
            : `This is ${title} as it now stands. Your edits were not kept.`}
        </Callout>
      );
    case 'failed':
      return <Callout kind="error" title={failureText('Not saved', outcome.status)} />;
    case undefined:
      return null;
  }
}
