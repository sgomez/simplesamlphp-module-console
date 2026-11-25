import { Button, LinkButton } from '../../design-system/Button';
import { Diff } from '../../design-system/Diff';
import { Row } from '../../design-system/Row';
import { RowDisclosure } from '../../design-system/RowDisclosure';
import { editPath } from '../entities';
import { LABELS } from './labels';
import type { ChangeState, PendingChange } from './types';

interface ChangeRowProps {
  state: ChangeState;
  change: PendingChange;
  // Absent while the API cannot discard.
  onDiscard?: ((entityId: string) => void) | undefined;
}

function Head({ state, change }: Omit<ChangeRowProps, 'onDiscard'>) {
  const { sign, verb } = LABELS[state];
  const end = change.loadError ?? change.summary;

  return (
    <>
      <span className="mono change-sign" aria-hidden="true">
        {sign}
      </span>
      <span className="muted change-verb">{verb}</span>
      <span className="row-name wrap-any">{change.name ?? change.entityId}</span>
      <span className="small faint">{change.kind ?? 'Service provider'}</span>
      {end !== undefined && <span className="small muted change-end">{end}</span>}
    </>
  );
}

// A row unfolds to its diff where the API serves one; otherwise it opens the edit screen, when there is one.
export function ChangeRow({ state, change, onDiscard }: ChangeRowProps) {
  const head = <Head state={state} change={change} />;
  if (change.diff === undefined || change.loadError !== null) {
    return change.opens ? (
      <Row to={editPath(change.entityId)} tight>
        {head}
      </Row>
    ) : (
      <Row plain tight>
        {head}
      </Row>
    );
  }

  return (
    <RowDisclosure head={head}>
      <Diff lines={change.diff} />
      <div className="change-actions">
        {change.opens && (
          <LinkButton small to={editPath(change.entityId)}>
            Open
          </LinkButton>
        )}
        {onDiscard && (
          <Button variant="quiet" small onPress={() => onDiscard(change.entityId)}>
            Discard this change
          </Button>
        )}
      </div>
    </RowDisclosure>
  );
}
