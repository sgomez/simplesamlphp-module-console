import { PUBLISH } from '../../app/paths';
import { LinkButton } from '../../components/ui/Button';
import { Callout } from '../../components/ui/Callout';

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

function Review({ count }: { count: number }) {
  return (
    <LinkButton small to={PUBLISH}>
      <span className="dot dot-half" aria-hidden="true" />
      {`Review ${count} ${count === 1 ? 'change' : 'changes'}`}
    </LinkButton>
  );
}

export function Outcome({ outcome, title, state, pending }: OutcomeProps) {
  switch (outcome?.kind) {
    case 'saved':
      return (
        <Callout
          kind="success"
          title={state === 'Up to date' ? 'Saved.' : 'Saved. Not live yet.'}
          action={pending > 0 && <Review count={pending} />}
        />
      );
    case 'invalid':
      return outcome.readable ? (
        <Callout kind="error" title={`Not saved: ${outcome.count} ${outcome.count === 1 ? 'error' : 'errors'}`} />
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
      return (
        <Callout
          kind="error"
          title={
            outcome.status === 0
              ? 'Not saved: the Console could not be reached.'
              : `Not saved: the server answered ${outcome.status}.`
          }
        />
      );
    case undefined:
      return null;
  }
}
