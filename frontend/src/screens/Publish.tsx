import { useState } from 'react';
import { postJson } from '../app/http/client';
import { API } from '../app/http/paths';
import type { PublicationRefused, PublicationReview, Published } from '../domain/publication';
import { Page } from '../design-system/Page';
import { useSettle } from '../domain/session';
import { useApi } from '../app/useApi';
import { Callout } from '../design-system/Callout';
import { PublishChanges } from './PublishChanges';
import { Problems, Warnings } from './PublishNotes';
import { Nothing, PublishOutcome, type Outcome } from './PublishOutcome';
import { PublishPanel } from './PublishPanel';

// A 409, moved or blocked, means the Pending changes or their problems changed (SPEC 10.14): the current review.
function movedReview(status: number, body: unknown): PublicationReview | null {
  const refused = body as Partial<PublicationRefused> | null;

  return status === 409 && refused?.review !== undefined ? refused.review : null;
}

export function Publish({ onChange }: { onChange: () => void }) {
  const settle = useSettle();
  const [revision, setRevision] = useState(0);
  const answer = useApi<PublicationReview>(API.publication, { revision });
  const [moved, setMoved] = useState<PublicationReview | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  // The review answered before a Publication: a new revision keeps it until the new one arrives; it is not shown.
  const [spent, setSpent] = useState<PublicationReview | null>(null);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const fetched = answer.state === 'ready' && answer.data !== spent ? answer.data : null;
  const review = moved ?? fetched;

  const publish = async (hash: string) => {
    setSending(true);
    const result = await postJson<Published>(API.publication, { hash, comment });
    setSending(false);
    if (result.ok) {
      setOutcome({ kind: 'published', published: result.data });
      setSpent(answer.state === 'ready' ? answer.data : null);
      setMoved(null);
      setComment('');
      setRevision((n) => n + 1);
      onChange();

      return;
    }
    const current = movedReview(result.status, result.body);
    if (current === null) {
      settle(result, (status) => setOutcome({ kind: 'failed', status }));

      return;
    }
    setOutcome(null);
    setMoved(current);
    onChange();
  };

  const nothing = review !== null && review.groups.length === 0 && review.problems.length === 0;

  return (
    <Page width={review !== null && !nothing ? 'publish' : undefined}>
      <h1 className="h1">Publish</h1>
      <PublishOutcome outcome={outcome} />
      {review && nothing && <Nothing review={review} />}
      {review && !nothing && (
        <div className="cols">
          <div className="col-main publish-main">
            {moved && <Callout kind="warning" title="The changes moved while this page was open" />}
            {review.problems.length > 0 && <Problems problems={review.problems} />}
            {review.canPublish && !moved && <Callout kind="success" title="Ready to publish" />}
            {review.warnings.length > 0 && <Warnings warnings={review.warnings} />}
            {review.groups.length > 0 && <PublishChanges review={review} current={review.current} />}
          </div>
          <PublishPanel
            review={review}
            comment={comment}
            sending={sending}
            onComment={setComment}
            onPublish={() => void publish(review.hash)}
          />
        </div>
      )}
    </Page>
  );
}
