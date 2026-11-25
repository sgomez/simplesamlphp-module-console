import { Callout } from '../../design-system/Callout';
import { Card } from '../../design-system/Card';
import { Pre } from '../../design-system/Code';
import { Empty } from '../../design-system/Empty';
import { WarningIcon } from '../../design-system/icons';
import { Row } from '../../design-system/Row';
import { failureText } from '../../lib/failureText';
import { useLoad } from '../session';
import { NodeRows } from './NodeRows';
import { useNodesPort, type Detail, type NodeList, type NodeProblem } from './port';

function Text({ detail }: { detail: Detail }) {
  return detail.map((part, index) => (typeof part === 'string' ? part : <span key={index} className="mono">{part.code}</span>));
}

function Problem({ problem }: { problem: NodeProblem }) {
  return (
    <Row plain className="node-problem">
      <WarningIcon className="ic ic-warning" />
      <div className={problem.fix === null ? 'node-problem-text' : 'node-problem-text node-problem-fix'}>
        <span className="callout-title">{problem.title}</span>
        {problem.detail.length > 0 && (
          <span className="small muted">
            <Text detail={problem.detail} />
          </span>
        )}
        {problem.fix !== null && <Pre label="PHP">{problem.fix}</Pre>}
      </div>
    </Row>
  );
}

function Problems({ list }: { list: NodeList }) {
  const here = list.nodes.find((node) => node.here);
  if (here === undefined || list.problems.length === 0) {
    return null;
  }

  return (
    <section className="node-problems">
      <div className="node-problems-head">
        <h2 className="h2">{`Problems on ${here.identifier}`}</h2>
        <span className="small muted">Detail is only known for the node serving this page</span>
      </div>
      <Card list>
        {list.problems.map((problem) => (
          <Problem key={problem.title} problem={problem} />
        ))}
      </Card>
    </section>
  );
}

// SPEC 10.16.
export function Nodes() {
  const port = useNodesPort();
  const answer = useLoad('nodes', () => port.nodes());
  if (answer.state === 'loading') {
    return null;
  }
  if (answer.state === 'failed') {
    return <Callout kind="error" title={failureText('Nodes not loaded', answer.status)} />;
  }
  const list = answer.data;
  if (list.nodes.length === 0) {
    return <Empty title="No node has checked in yet" text="Nodes appear here when they fetch a Snapshot." />;
  }
  const others = list.nodes.some((node) => !node.here && node.hasProblems);

  return (
    <>
      <NodeRows list={list} />
      {list.nodes.length === 1 && <span className="small muted">One node. More appear here when they fetch a Snapshot.</span>}
      <Problems list={list} />
      {others && <span className="small muted">The problems of another node can only be read on that node.</span>}
    </>
  );
}
