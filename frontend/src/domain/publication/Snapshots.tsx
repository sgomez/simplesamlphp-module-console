import { LinkButton } from '../../design-system/Button';
import { Callout } from '../../design-system/Callout';
import { Card } from '../../design-system/Card';
import { Empty } from '../../design-system/Empty';
import { Row } from '../../design-system/Row';
import { Status } from '../../design-system/Status';
import { failureText } from '../../lib/failureText';
import { plural } from '../../lib/plural';
import { when } from '../../lib/time';
import { useLoad } from '../session';
import { rollbackPath, useHistoryPort, type RetainedSnapshot } from './history';

function SnapshotRow({ snapshot, live }: { snapshot: RetainedSnapshot; live: boolean }) {
  const { number, createdAt, createdBy, comment, changes } = snapshot;

  return (
    <Row plain className="snap-row">
      <span className="snap-number">{`#${number}`}</span>
      <div className="snap-main">
        <span className={comment === null ? 'faint' : undefined}>{comment ?? 'No comment'}</span>
        <span className="small muted">
          {`${when(createdAt)} · `}
          <span className="mono">{createdBy}</span>
          {` · ${plural(changes, 'change', 'changes')}`}
        </span>
      </div>
      {live ? (
        <Status tone="live" mark="full">
          Live
        </Status>
      ) : (
        <LinkButton small to={rollbackPath(number)}>
          Roll back to this
        </LinkButton>
      )}
    </Row>
  );
}

// SPEC 10.15, the Snapshots tab.
export function Snapshots() {
  const port = useHistoryPort();
  const answer = useLoad('snapshots', () => port.snapshots());
  if (answer.state === 'loading') {
    return null;
  }
  if (answer.state === 'failed') {
    return <Callout kind="error" title={failureText('Snapshots not loaded', answer.status)} />;
  }
  const { snapshots, current, retention } = answer.data;
  if (snapshots.length === 0) {
    return <Empty title="Nothing published yet" />;
  }

  return (
    <>
      <Card list>
        {snapshots.map((snapshot) => (
          <SnapshotRow key={snapshot.number} snapshot={snapshot} live={snapshot.number === current} />
        ))}
      </Card>
      <span className="small muted">{`${snapshots.length} of ${retention} kept`}</span>
    </>
  );
}
