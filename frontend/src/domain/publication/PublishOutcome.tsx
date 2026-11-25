import { LinkButton } from '../../design-system/Button';
import { Callout } from '../../design-system/Callout';
import { Card } from '../../design-system/Card';
import { Chip } from '../../design-system/Chip';
import { Empty } from '../../design-system/Empty';
import { Row } from '../../design-system/Row';
import { Status } from '../../design-system/Status';
import { failureText } from '../../lib/failureText';
import { plural } from '../../lib/plural';
import { useSessionPort } from '../session';
import { HISTORY } from './history';
import type { NodeStatus, PublicationReview } from './types';
import type { Outcome } from './usePublish';

// Absent while the Console has no History screen.
function useHistory(small = false) {
  const { screens } = useSessionPort();

  return screens.includes('history') ? (
    <LinkButton small={small} to={HISTORY}>
      History
    </LinkButton>
  ) : undefined;
}

export function Failed({ outcome }: { outcome: Outcome }) {
  return outcome?.kind === 'failed' ? <Callout kind="error" title={failureText(outcome.lead, outcome.status)} /> : null;
}

export function Done({ outcome }: { outcome: Extract<Outcome, { kind: 'published' }> }) {
  const { published, count } = outcome;
  const title = `Snapshot #${published.number} is published`;
  const changes = `${plural(count, 'change', 'changes')}.`;
  const history = useHistory(true);

  return (
    <Callout kind={published.build === null ? 'success' : 'warning'} title={title} action={history}>
      {published.build === null ? changes : `${changes} ${published.build}`}
    </Callout>
  );
}

function NodeRow({ node, number }: { node: NodeStatus; number: number }) {
  return (
    <Row plain wrap>
      <div className="row-main">
        <span className="mono node-id">
          {node.id}
          {node.here && <Chip>This node</Chip>}
        </span>
      </div>
      <div className="node-state">
        {node.serves === number ? (
          <Status tone="live" mark="full">{`Serves #${node.serves}`}</Status>
        ) : (
          <Status tone="pending" mark="half">{`Still on #${node.serves}`}</Status>
        )}
        <span className="small muted node-check">{node.checked}</span>
      </div>
    </Row>
  );
}

export function NodeList({ nodes, number }: { nodes: readonly NodeStatus[]; number: number }) {
  return (
    <>
      <h2 className="h2">Nodes</h2>
      <Card list>
        {nodes.map((node) => (
          <NodeRow key={node.id} node={node} number={number} />
        ))}
      </Card>
    </>
  );
}

export function Nothing({ review }: { review: PublicationReview }) {
  const history = useHistory();
  if (review.current === null) {
    return <Empty title="Nothing to publish" />;
  }

  return (
    <Empty
      title="Nothing to publish"
      text={`Everything saved is live in Snapshot #${review.current.number}.`}
      {...(history ? { actions: history } : {})}
    />
  );
}
