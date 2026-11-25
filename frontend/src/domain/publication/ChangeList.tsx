import { Card } from '../../design-system/Card';
import { plural } from '../../lib/plural';
import { ChangeRow } from './ChangeRow';
import { changeCount } from './counts';
import { ordered } from './labels';
import type { PublicationReview } from './types';

interface ChangeListProps {
  review: PublicationReview;
  onDiscard?: ((entityId: string) => void) | undefined;
}

export function ChangeList({ review, onDiscard }: ChangeListProps) {
  return (
    <>
      <div className="section-head">
        <h2 className="h2">{plural(changeCount(review), 'change', 'changes')}</h2>
        {review.current && <span className="small faint">{`against Snapshot #${review.current.number}`}</span>}
      </div>
      <Card list>
        {ordered(review.groups).flatMap((group) =>
          group.changes.map((change) => (
            <ChangeRow key={`${group.state} ${change.entityId}`} state={group.state} change={change} onDiscard={onDiscard} />
          )),
        )}
      </Card>
    </>
  );
}
