import { useLoad } from '../../session';
import { useEntitiesPort } from '../port';
import type { EditedEntity } from '../types';
import { EntityEditor } from './EntityEditor';

interface FilledEntityProps {
  php: string;
  // An entity already managed, which the text replaces; none for a new one.
  entityId?: string;
  onCreated: (entity: EditedEntity) => void;
  onCancel: () => void;
}

const noop = () => undefined;

function fresh(php: string): EditedEntity {
  return { entityId: '', name: null, version: 0, state: null, unreadable: false, inSnapshot: false, error: null, php, raw: null, errors: [], warnings: [], notices: [] };
}

function Replaced({ entityId, php }: { entityId: string; php: string }) {
  const port = useEntitiesPort();
  const answer = useLoad(`entity#${entityId}`, () => port.read(entityId), { entityId });

  return answer.state === 'ready' ? <EntityEditor initial={answer.data} text={php} onSaved={noop} onTitle={noop} /> : null;
}

// SPEC 9.6 and 9.7: the editor opened on text read from pasted configuration, unsaved.
export function FilledEntity({ php, entityId, onCreated, onCancel }: FilledEntityProps) {
  if (entityId !== undefined) {
    return <Replaced entityId={entityId} php={php} />;
  }

  return <EntityEditor initial={fresh(php)} onSaved={noop} onTitle={noop} onCreated={onCreated} onCancel={onCancel} />;
}
