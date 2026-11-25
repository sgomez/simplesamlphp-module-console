import { plural } from '../../lib/plural';
import { ReviewChanges } from '../../domain/publication';
import { failureText } from '../../lib/failureText';
import { Callout } from '../../design-system/Callout';

// What the last save came to; null before any.
export type SaveOutcome =
  | { kind: 'saved' }
  | { kind: 'invalid'; count: number; readable: boolean }
  | { kind: 'race' }
  | { kind: 'failed'; status: number }
  | null;

interface OutcomeProps {
  outcome: SaveOutcome;
  title: string;
  state: string | null;
  pending: number;
}

export function Outcome({ outcome, title, state, pending }: OutcomeProps) {
  switch (outcome?.kind) {
    case 'saved':
      return (
        <Callout
          kind="success"
          title={state === 'Up to date' ? 'Saved.' : 'Saved. Not live yet.'}
          action={pending > 0 && <ReviewChanges count={pending} variant="secondary" />}
        />
      );
    case 'invalid':
      return outcome.readable ? (
        <Callout kind="error" title={`Not saved: ${plural(outcome.count, 'error', 'errors')}`} />
      ) : (
        <Callout kind="error" title="Not saved: the text could not be read">
          Nothing else is checked until this is fixed.
        </Callout>
      );
    case 'race':
      return (
        <Callout kind="error" title={`Not saved: ${title} changed meanwhile`}>
          {`This is ${title} as it now stands. Your edits were not kept.`}
        </Callout>
      );
    case 'failed':
      return <Callout kind="error" title={failureText('Not saved', outcome.status)} />;
    case undefined:
      return null;
  }
}
