import { Button, LinkButton } from '../../design-system/Button';
import { Callout } from '../../design-system/Callout';
import { Diff } from '../../design-system/Diff';
import { failureText } from '../../lib/failureText';
import { plural } from '../../lib/plural';
import { HISTORY, type RollbackObject, type RollbackPlan } from './history';
import type { Rollback } from './useRollback';

const FATES = { removed: 'removed from nodes', added: 'added to nodes' } as const;

const BROKEN = {
  checksum: 'Its checksum does not match: the stored copy is damaged.',
  format: 'It was written by a newer version of the module than this node runs.',
} as const;

function ChangedObject({ object }: { object: RollbackObject }) {
  const kind = object.fate === null ? object.kind : `${object.kind} · ${FATES[object.fate]}`;

  return (
    <>
      <span className="small rb-name">
        {object.name} <span className="faint rb-kind">{kind}</span>
      </span>
      <Diff lines={object.lines} />
    </>
  );
}

function Changes({ plan }: { plan: RollbackPlan }) {
  const { objects, more } = plan;

  return (
    <>
      <h2 className="h2">What changes on the nodes</h2>
      {objects.length === 0 && more === 0 && <span className="small muted">Nodes serve the same configuration.</span>}
      {objects.map((object) => (
        <ChangedObject key={object.name} object={object} />
      ))}
      {more > 0 && <span className="small muted">{plural(more, 'more object changes', 'more objects change')}</span>}
    </>
  );
}

function Missing({ modules }: { modules: string[] }) {
  const title = modules.length === 1 ? 'A module is missing on this node' : `${modules.length} modules are missing on this node`;

  return (
    <Callout kind="warning" title={title}>
      {`${modules.join(', ')}: this node leaves out the authsources that need ${modules.length === 1 ? 'it' : 'them'}.`}
    </Callout>
  );
}

// SPEC 10.15, the Rollback confirmation.
export function RollbackReview({ rollback }: { rollback: Rollback }) {
  const { answer, moved, failed } = rollback;
  if (answer.state === 'loading') {
    return null;
  }
  if (answer.state === 'failed') {
    return <Callout kind="error" title={failureText('Snapshot not loaded', answer.status)} />;
  }
  const plan = answer.data;
  const { target, broken } = plan;

  return (
    <>
      <h1 className="h1">{`Roll back to Snapshot #${target}`}</h1>
      {moved && (
        <Callout kind="warning" title="The live Snapshot changed while this page was open">
          {`Snapshot #${plan.current} is live now. This is the current difference.`}
        </Callout>
      )}
      {failed !== null && <Callout kind="error" title={failureText('Not rolled back', failed)} />}
      {broken === null ? (
        <Callout kind="info" title="Saved changes are not touched">
          {`Only what nodes serve changes. Snapshot #${target} becomes live again.`}
        </Callout>
      ) : (
        <Callout kind="error" title={`Snapshot #${target} cannot be rolled back to`}>
          {BROKEN[broken]}
        </Callout>
      )}
      {plan.missingModules.length > 0 && <Missing modules={plan.missingModules} />}
      {broken === null && <Changes plan={plan} />}
    </>
  );
}

// The bar under the page: no Rollback for a target that fails its checks.
export function RollbackBar({ rollback }: { rollback: Rollback }) {
  const { answer, busy, confirm } = rollback;
  if (answer.state !== 'ready' || answer.data.broken !== null) {
    return null;
  }

  return (
    <div className="save-bar">
      <div className="save-state" />
      <LinkButton variant="quiet" to={HISTORY}>
        Cancel
      </LinkButton>
      <Button variant="primary" loading={busy} onPress={confirm}>
        {`Roll back to #${answer.data.target}`}
      </Button>
    </div>
  );
}
