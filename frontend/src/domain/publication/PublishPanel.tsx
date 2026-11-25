import { Button } from '../../design-system/Button';
import { Facts, type Fact } from '../../design-system/Facts';
import { Field } from '../../design-system/Field';
import { TextArea } from '../../design-system/TextArea';
import { plural } from '../../lib/plural';
import { changeCount } from './counts';
import type { PublicationReview } from './types';
import type { Discard } from './useDiscard';
import type { Publish } from './usePublish';

interface PanelProps {
  review: PublicationReview;
  publish: Publish;
  discard: Discard;
}

export function PublishPanel({ review, publish, discard }: PanelProps) {
  const { nodes, comment, sending, setComment } = publish;
  const problems = review.problems.length;
  const facts: Fact[] = [{ term: 'Becomes', value: `Snapshot #${review.nextNumber}`, className: 'is-strong' }];
  if (nodes !== null) {
    facts.push({ term: 'Nodes', value: nodes.length });
  }

  return (
    <aside className="card publish-panel" aria-label="This Publication">
      <h2 className="h2">This Publication</h2>
      <Facts facts={facts} />
      <Field label="Comment" optional value={comment} onChange={setComment}>
        <TextArea rows={3} />
      </Field>
      <Button variant="primary" disabled={!review.canPublish || sending} loading={sending} onPress={publish.publish}>
        {sending ? 'Publishing' : `Publish ${plural(changeCount(review), 'change', 'changes')}`}
      </Button>
      {problems > 0 && <div className="msg-error">{`Fix ${plural(problems, 'problem', 'problems')} to publish.`}</div>}
      {discard.all && (
        <div className="panel-foot">
          <Button variant="danger" small onPress={discard.all.ask}>
            {discard.all.label}
          </Button>
          {discard.all.dialog}
        </div>
      )}
    </aside>
  );
}
