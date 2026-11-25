import { useContext, useState } from 'react';
import { postJson } from '../api/client';
import type { PublicationRefused, PublicationReview, Published } from '../api/types';
import { useFailure } from '../app/failure';
import { Page } from '../app/Page';
import { refusalOf, ReportRefusal } from '../app/refusals';
import { useApi } from '../app/useApi';
import { Callout } from '../components/ui/Callout';
import { PublishChanges } from './PublishChanges';
import { Problems, Warnings } from './PublishNotes';
import { Nothing, PublishOutcome, type Outcome } from './PublishOutcome';
import { PublishPanel } from './PublishPanel';

// 409 and 422 both mean the Pending changes or their problems changed (SPEC 10.14): the current review.
function movedReview(status: number, body: unknown): PublicationReview | null {
  const refused = body as Partial<PublicationRefused> | null;

  return (status === 409 || status === 422) && refused?.review !== undefined ? refused.review : null;
}

export function Publish({ onChange }: { onChange: () => void }) {
  const fail = useFailure();
  const refuse = useContext(ReportRefusal);
  const [revision, setRevision] = useState(0);
  const answer = useApi<PublicationReview>('/publication', { revision });
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
    const result = await postJson<Published>('/publication', { hash, comment });
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
    if (fail(result.status)) {
      return;
    }
    const refused = refusalOf(result.status, result.body);
    if (refused) {
      refuse(refused);

      return;
    }
    const current = movedReview(result.status, result.body);
    if (current === null) {
      setOutcome({ kind: 'failed', status: result.status });

      return;
    }
    setOutcome(null);
    setMoved(current);
    onChange();
  };

  const nothing = review !== null && review.groups.length === 0 && review.problems.length === 0;

  return (
    <Page publish={review !== null && !nothing}>
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
