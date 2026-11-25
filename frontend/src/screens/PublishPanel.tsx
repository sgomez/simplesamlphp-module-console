import { changeCount, type PublicationReview } from '../domain/publication';
import { Button } from '../design-system/Button';
import { Facts } from '../design-system/Facts';
import { Field } from '../design-system/Field';
import { TextArea } from '../design-system/TextArea';
import { plural } from '../lib/plural';

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
      <Field label="Comment" optional value={comment} onChange={onComment}>
        <TextArea rows={3} />
      </Field>
      <Button variant="primary" disabled={!review.canPublish || sending} loading={sending} onPress={onPublish}>
        {`Publish ${plural(changeCount(review), 'change', 'changes')}`}
      </Button>
      {problems > 0 && <div className="msg-error">{`Fix ${plural(problems, 'problem', 'problems')} to publish.`}</div>}
    </aside>
  );
}
