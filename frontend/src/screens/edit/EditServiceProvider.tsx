import { useSearchParams } from 'react-router';
import { spEntityOf } from '../../app/http/paths';
import type { EditedEntity } from '../../domain/entities';
import { Unknown } from '../../app/Unknown';
import { useApi } from '../../app/useApi';
import { EntityEditor } from './EntityEditor';
import { UnreadableEntity } from './UnreadableEntity';

interface StoredProps {
  pending: number;
  onSaved: () => void;
  onTitle: (title: string) => void;
}

interface EditServiceProviderProps extends StoredProps {
  // The entity a create has just answered, shown once as saved.
  created: EditedEntity | null;
}

export function EditServiceProvider({ created, ...props }: EditServiceProviderProps) {
  const [params] = useSearchParams();
  const entityId = params.get('entityid') ?? '';
  if (entityId === '') {
    return <Unknown />;
  }
  if (created?.entityId === entityId) {
    return <EntityEditor key={entityId} initial={created} saved {...props} />;
  }

  return <StoredServiceProvider key={entityId} entityId={entityId} {...props} />;
}

// useApi replaces the screen on 401, 403 and 404.
function StoredServiceProvider({ entityId, pending, onSaved, onTitle }: StoredProps & { entityId: string }) {
  const answer = useApi<EditedEntity>(spEntityOf(entityId), { entityId });
  if (answer.state !== 'ready') {
    return null;
  }
  if (answer.data.php === null) {
    return <UnreadableEntity entity={answer.data} onTitle={onTitle} />;
  }

  return <EntityEditor initial={answer.data} pending={pending} onSaved={onSaved} onTitle={onTitle} />;
}
