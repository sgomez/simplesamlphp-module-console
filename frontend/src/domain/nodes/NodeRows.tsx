import { Card } from '../../design-system/Card';
import { Chip } from '../../design-system/Chip';
import { Row } from '../../design-system/Row';
import { Status, type StatusTone } from '../../design-system/Status';
import { plural } from '../../lib/plural';
import { ago } from '../../lib/time';
import type { NodeList, NodeRow } from './port';

const STALE_MS = 5 * 60 * 1000;

function serves({ served }: NodeRow, current: number | null): { text: string; behind: boolean } {
  if (served === null) {
    return { text: 'Serves nothing', behind: true };
  }
  const text = `Serves #${served}`;
  if (current === null || served === current) {
    return { text, behind: false };
  }

  return { text: served < current ? `${text} · ${current - served} behind` : `${text} · not live`, behind: true };
}

// SPEC 10.16: a row stands out when it serves another number, has not checked for 5 minutes or has problems.
function NodeLine({ node, list }: { node: NodeRow; list: NodeList }) {
  const { text, behind } = serves(node, list.current);
  const stale = Date.parse(list.now) - Date.parse(node.checkedAt) > STALE_MS;
  const problems = node.here ? plural(list.problems.length, 'problem', 'problems') : 'has problems';
  const tone: StatusTone = behind ? 'danger' : node.hasProblems || stale ? 'warn' : 'live';
  const checked = ago(node.checkedAt, list.now);

  return (
    <Row plain wrap>
      <div className="node-main">
        <span className="mono node-name">
          {node.identifier}
          {node.here && <> <Chip>This node</Chip></>}
        </span>
      </div>
      <div className="node-end">
        <Status tone={tone} mark={behind ? 'minus' : 'full'}>
          {node.hasProblems ? `${text} · ${problems}` : text}
        </Status>
        <span className="small muted node-checked">{stale ? `Last checked ${checked}` : checked}</span>
      </div>
    </Row>
  );
}

export function NodeRows({ list }: { list: NodeList }) {
  return (
    <Card list>
      {list.nodes.map((node) => (
        <NodeLine key={node.identifier} node={node} list={list} />
      ))}
    </Card>
  );
}
