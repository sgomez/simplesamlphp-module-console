import { changeCount, type ChangeState, type PendingChange, type PublicationReview } from '../domain/publication';
import type { CurrentSnapshot } from '../domain/session';
import { plural } from '../lib/plural';
import { editPath } from '../app/paths';
import { Card } from '../design-system/Card';
import { Eid } from '../design-system/Eid';
import { Row } from '../design-system/Row';

const signs: Record<ChangeState, string> = { Unpublished: '+', Modified: '~', Deleted: '×', Unreadable: '!' };

function ChangeRow({ state, change }: { state: ChangeState; change: PendingChange }) {
  const content = (
    <>
      <span className="mono change-sign" aria-hidden="true">
        {signs[state]}
      </span>
      <span className="muted change-verb">{state}</span>
      <Eid id={change.entityId} />
      <span className="small faint">Service provider</span>
      {change.loadError !== null && <span className="small muted change-end">{change.loadError}</span>}
    </>
  );

  return change.opens ? (
    <Row to={editPath(change.entityId)} tight>
      {content}
    </Row>
  ) : (
    <Row plain tight>
      {content}
    </Row>
  );
}

export function PublishChanges({ review, current }: { review: PublicationReview; current: CurrentSnapshot | null }) {
  return (
    <>
      <div className="section-head">
        <h2 className="h2">{plural(changeCount(review), 'change', 'changes')}</h2>
        {current && <span className="small faint">{`against Snapshot #${current.number}`}</span>}
      </div>
      <Card list>
        {review.groups.flatMap((group) =>
          group.changes.map((change) => (
            <ChangeRow key={`${group.state} ${change.entityId}`} state={group.state} change={change} />
          )),
        )}
      </Card>
    </>
  );
}
