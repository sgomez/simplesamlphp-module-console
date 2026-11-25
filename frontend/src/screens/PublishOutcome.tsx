import type { PublicationReview, Published } from '../domain/publication';
import { failureText } from '../lib/failureText';
import { Callout } from '../design-system/Callout';
import { Empty } from '../design-system/Empty';

// What the last confirming request came to; null before any.
export type Outcome = { kind: 'published'; published: Published } | { kind: 'failed'; status: number } | null;

export function PublishOutcome({ outcome }: { outcome: Outcome }) {
  if (outcome === null) {
    return null;
  }
  if (outcome.kind === 'failed') {
    return <Callout kind="error" title={failureText('Not published', outcome.status)} />;
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
