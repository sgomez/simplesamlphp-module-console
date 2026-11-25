import { useEntitiesPort } from '../port';
import { useLoad } from '../../session';
import type { EditedEntity } from '../types';
import { EntityEditor } from './EntityEditor';

interface NewEntityProps {
  onSaved: () => void;
  onTitle: (title: string) => void;
  onCreated: (entity: EditedEntity) => void;
  onCancel: () => void;
}

// The edit screen of an object not saved yet, opened on the starter text of the set.
export function NewEntity(props: NewEntityProps) {
  const port = useEntitiesPort();
  const answer = useLoad('starter', () => port.starter());

  return answer.state === 'ready' ? <EntityEditor initial={answer.data} {...props} /> : null;
}
