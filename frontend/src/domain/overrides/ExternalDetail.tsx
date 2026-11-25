import { Button, LinkButton } from '../../design-system/Button';
import { Callout } from '../../design-system/Callout';
import { Pre } from '../../design-system/Code';
import { Status } from '../../design-system/Status';
import { failureText } from '../../lib/failureText';
import { externalCopyPath, type ExternalCopy, type ExternalEntity } from './external';
import { ExternalHead } from './ExternalList';
import type { ExternalDetail as Detail } from './useExternalEntity';

function Copy({ copy, several }: { copy: ExternalCopy; several: boolean }) {
  return (
    <>
      <div className="src-head">
        <span className="small muted">
          {`${copy.heading} · `}
          <span className="mono wrap-any">{copy.location}</span>
        </span>
        {several && copy.served && (
          <Status tone="live" mark="full">
            Served
          </Status>
        )}
      </div>
      <div className="code-head">
        <h2 className="h3 code-title">PHP</h2>
        <Button variant="quiet" small onPress={() => void navigator.clipboard.writeText(copy.php)}>
          Copy
        </Button>
      </div>
      <Pre label="PHP">{copy.php}</Pre>
    </>
  );
}

// SPEC 9.2: every copy the node's sources hold, in source order, the one the node serves marked.
export function ExternalEntityView({ detail }: { detail: Detail }) {
  const { answer } = detail;
  if (answer.state === 'loading') {
    return null;
  }
  if (answer.state === 'failed') {
    return <Callout kind="error" title={failureText('External entity not loaded', answer.status)} />;
  }
  const { name, entityId, copies } = answer.data;

  return (
    <>
      <ExternalHead title={name ?? entityId} entityId={name === null ? undefined : entityId} />
      {copies.map((copy) => (
        <Copy key={copy.position} copy={copy} several={copies.length > 1} />
      ))}
    </>
  );
}

// SPEC 9.5 and 10.13: the copy of the served source, which stops following it.
export function ManagedCopyBar({ entity }: { entity: ExternalEntity }) {
  const served = entity.copies.find((copy) => copy.served);
  if (served === undefined) {
    return null;
  }

  return (
    <div className="save-bar">
      <div className="save-state">
        <span className="small muted">The copy replaces this entity on every node, as an Override.</span>
      </div>
      <LinkButton variant="primary" to={externalCopyPath(entity.set, entity.entityId, served.position)}>
        Create managed copy
      </LinkButton>
    </div>
  );
}
