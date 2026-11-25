import { Button } from '../../design-system/Button';
import { Callout } from '../../design-system/Callout';
import { Card } from '../../design-system/Card';
import { failureText } from '../../lib/failureText';
import { onDay } from '../../lib/time';
import type { ComparedOption } from './port';
import type { Comparison } from './useComparison';

function Value({ value, strong }: { value: string | null; strong: boolean }) {
  return value === null ? <span className="faint">Not set</span> : <span className={strong ? 'mono wrap-any is-strong' : 'mono wrap-any'}>{value}</span>;
}

function OptionRow({ row }: { row: ComparedOption }) {
  const same = row.managed === row.source;
  let verdict = <span className="faint">Same</span>;
  if (!same) {
    verdict = row.changedInSource ? <span className="is-strong">Differs · new in source</span> : <>Differs</>;
  }

  return (
    <tr>
      <td>
        <span className="mono wrap-any">{row.option}</span>
      </td>
      <td>
        <Value value={row.managed} strong={!same} />
      </td>
      <td>
        <Value value={row.source} strong={!same} />
      </td>
      <td>{verdict}</td>
    </tr>
  );
}

// SPEC 10.13, the Override comparison: the managed entity against its External entity, option by option.
export function OverrideCompare({ comparison }: { comparison: Comparison }) {
  const { answer, busy, failed, markReviewed } = comparison;
  if (answer.state === 'loading') {
    return null;
  }
  if (answer.state === 'failed') {
    return <Callout kind="error" title={failureText('Comparison not loaded', answer.status)} />;
  }
  const { entityId, name, changedOn, options } = answer.data;
  const action = (
    <Button variant="primary" small loading={busy} onPress={markReviewed}>
      Mark as reviewed
    </Button>
  );

  return (
    <>
      <div className="page-head">
        <div className="title-block cmp-title">
          <h1 className="h1 wrap-any">{name ?? entityId}</h1>
          {name !== null && <span className="mono muted wrap-any">{entityId}</span>}
        </div>
      </div>
      {failed !== null && <Callout kind="error" title={failureText('Not marked as reviewed', failed)} />}
      <Callout kind="info" title={changedOn === null ? 'The source has not been reviewed' : `The source changed on ${onDay(changedOn)}`} action={action} />
      <Card className="card-scroll">
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">Option</th>
              <th scope="col">Managed</th>
              <th scope="col">Source</th>
              <th scope="col">
                <span className="sr-only">Comparison</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {options.map((row) => (
              <OptionRow key={row.option} row={row} />
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
