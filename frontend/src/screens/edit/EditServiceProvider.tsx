import { useSearchParams } from 'react-router';
import type { EditedEntity } from '../../api/types';
import { useApi } from '../../app/useApi';
import { EntityEditor } from './EntityEditor';
import { UnreadableEntity } from './UnreadableEntity';

interface EditServiceProviderProps {
  pending: number;
  onSaved: () => void;
  onTitle: (title: string) => void;
}

// useApi replaces the screen on 401, 403 and 404.
export function EditServiceProvider({ pending, onSaved, onTitle }: EditServiceProviderProps) {
  const [params] = useSearchParams();
  const entityId = params.get('entityid') ?? '';
  const answer = useApi<EditedEntity>(`/entities/saml20-sp-remote/entity?entityid=${encodeURIComponent(entityId)}`, {
    entityId,
  });
  if (answer.state !== 'ready') {
    return null;
  }
  if (answer.data.php === null) {
    return <UnreadableEntity entity={answer.data} onTitle={onTitle} />;
  }

  return <EntityEditor key={entityId} initial={answer.data} pending={pending} onSaved={onSaved} onTitle={onTitle} />;
}
