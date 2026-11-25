import type { PublicationReview, Published } from '../api/types';
import { Callout } from '../components/ui/Callout';
import { Empty } from '../components/ui/Empty';

// What the last confirming request came to; null before any.
export type Outcome = { kind: 'published'; published: Published } | { kind: 'failed'; status: number } | null;

function reason(status: number): string {
  switch (status) {
    case 0:
      return 'the Console could not be reached';
    case 503:
      return 'the database is not ready';
    default:
      return `the server answered ${status}`;
  }
}

export function PublishOutcome({ outcome }: { outcome: Outcome }) {
  if (outcome === null) {
    return null;
  }
  if (outcome.kind === 'failed') {
    return <Callout kind="error" title={`Not published: ${reason(outcome.status)}`} />;
  }
  const { number, build } = outcome.published;
  const title = `Snapshot ${number} published`;

  return build === null ? (
    <Callout kind="success" title={title} />
  ) : (
    <Callout kind="warning" title={title}>
      {build}
    </Callout>
  );
}

export function Nothing({ review }: { review: PublicationReview }) {
  return (
    <Empty
      title="Nothing to publish"
      {...(review.current === null ? {} : { text: `Everything saved is live in Snapshot #${review.current.number}.` })}
    />
  );
}
