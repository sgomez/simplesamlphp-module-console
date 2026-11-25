import { Navigate, useParams, useSearchParams } from 'react-router';
import { Callout } from '../../design-system/Callout';
import { Page } from '../../design-system/Page';
import { failureText } from '../../lib/failureText';
import type { EntitySet } from '../entities';
import { useLoad } from '../session';
import { useHeld } from './hold';
import { PastedReview } from './PastedReview';
import { PickSeveral } from './PickSeveral';
import { addPath, AUTHSOURCE_REVIEW, replacePath, usePastedPort } from './port';
import { ReplaceReview } from './Replace';
import { AUTHSOURCES } from './useSavePasted';

// Each step shows what the one before it read; reached any other way, it goes back to that step.
export function HeldReview({ set }: { set: EntitySet }) {
  const held = useHeld(addPath(set, '/review'), 'one');

  return held ? <PastedReview object={held.reading.object} target={{ kind: 'entity', set }} back={addPath(set)} /> : <Navigate to={addPath(set)} replace />;
}

export function HeldSeveral({ set }: { set: EntitySet }) {
  const held = useHeld(addPath(set, '/several'), 'several');

  return held ? <PickSeveral set={set} held={held} /> : <Navigate to={addPath(set)} replace />;
}

export function HeldReplacement({ set }: { set: EntitySet }) {
  const entityId = useSearchParams()[0].get('entityid') ?? '';
  const held = useHeld(replacePath(set, entityId, '/review'), 'replaced');

  return held ? <ReplaceReview set={set} replacement={held.reading.replacement} /> : <Navigate to={replacePath(set, entityId)} replace />;
}

export function HeldAuthsource() {
  const held = useHeld(AUTHSOURCE_REVIEW, 'one');
  const back = `${AUTHSOURCES}/new`;

  return held ? <PastedReview object={held.reading.object} target={{ kind: 'authsource' }} back={back} /> : <Navigate to={back} replace />;
}

// SPEC 9.5: "Create managed copy" reads one copy of an External entity as pasted configuration is read.
export function ManagedCopy({ back }: { back: (set: EntitySet, entityId: string) => string }) {
  const [params] = useSearchParams();
  const set = (useParams()['set'] ?? '') as EntitySet;
  const entityId = params.get('entityid') ?? '';
  const source = Number(params.get('source') ?? 0);
  const port = usePastedPort();
  const answer = useLoad(`copy#${set}#${entityId}#${source}`, () => port.copy(set, entityId, source), { entityId });
  if (answer.state === 'loading') {
    return null;
  }
  if (answer.state === 'failed') {
    return (
      <Page width="wide">
        <Callout kind="error" title={failureText('Not read', answer.status)} />
      </Page>
    );
  }

  return <PastedReview object={answer.data} target={{ kind: 'entity', set }} back={back(set, entityId)} copy />;
}
