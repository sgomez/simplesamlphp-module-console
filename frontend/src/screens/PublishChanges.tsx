import { consoleUrl } from '../api/client';
import type { ChangeState, CurrentSnapshot, PendingChange, PublicationReview } from '../api/types';
import { changeCount, plural } from '../app/counts';
import { Card } from '../components/ui/Card';
import { Eid } from '../components/ui/Eid';
import { Row } from '../components/ui/Row';

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

  return change.edit === null ? (
    <Row plain tight>
      {content}
    </Row>
  ) : (
    <Row href={consoleUrl(change.edit)} tight>
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
