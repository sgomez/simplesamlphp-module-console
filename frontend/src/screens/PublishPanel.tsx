import type { PublicationReview } from '../api/types';
import { Button } from '../components/ui/Button';
import { Facts } from '../components/ui/Facts';
import { Field } from '../components/ui/Field';
import { TextArea } from '../components/ui/TextArea';
import { changeCount, plural } from '../app/counts';

interface PanelProps {
  review: PublicationReview;
  comment: string;
  sending: boolean;
  onComment: (comment: string) => void;
  onPublish: () => void;
}

export function PublishPanel({ review, comment, sending, onComment, onPublish }: PanelProps) {
  const problems = review.problems.length;

  return (
    <aside className="card publish-panel" aria-label="This Publication">
      <h2 className="h2">This Publication</h2>
      <Facts facts={[{ term: 'Becomes', value: `Snapshot #${review.nextNumber}`, className: 'is-strong' }]} />
      <Field id="publish-comment" label="Comment" optional>
        <TextArea id="publish-comment" rows={3} value={comment} onChange={onComment} />
      </Field>
      <Button variant="primary" disabled={!review.canPublish || sending} loading={sending} onClick={onPublish}>
        {`Publish ${plural(changeCount(review), 'change', 'changes')}`}
      </Button>
      {problems > 0 && <div className="msg-error">{`Fix ${plural(problems, 'problem', 'problems')} to publish.`}</div>}
    </aside>
  );
}
