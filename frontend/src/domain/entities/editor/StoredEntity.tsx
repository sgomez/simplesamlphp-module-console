import { useLayoutEffect, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { useFailure, useLoad } from '../../session';
import { useEntitiesPort } from '../port';
import type { EditedEntity } from '../types';
import { EntityEditor } from './EntityEditor';
import { UnreadableEntity } from './UnreadableEntity';

interface StoredProps {
  review?: ReactNode;
  onSaved: () => void;
  onTitle: (title: string) => void;
}

interface StoredEntityProps extends StoredProps {
  // The entity a create has just answered, shown once as saved.
  created: EditedEntity | null;
}

function NoEntityId() {
  const fail = useFailure();
  useLayoutEffect(() => {
    fail(404);
  }, [fail]);

  return null;
}

// The object the URL names; a 403 or 404 replaces the screen.
function Loaded({ entityId, ...props }: StoredProps & { entityId: string }) {
  const port = useEntitiesPort();
  const answer = useLoad(`entity#${entityId}`, () => port.read(entityId), { entityId });
  if (answer.state !== 'ready') {
    return null;
  }
  if (answer.data.php === null) {
    return <UnreadableEntity entity={answer.data} onTitle={props.onTitle} />;
  }

  return <EntityEditor initial={answer.data} {...props} />;
}

export function StoredEntity({ created, ...props }: StoredEntityProps) {
  const [params] = useSearchParams();
  const entityId = params.get('entityid') ?? '';
  if (entityId === '') {
    return <NoEntityId />;
  }
  if (created?.entityId === entityId) {
    return <EntityEditor key={entityId} initial={created} saved {...props} />;
  }

  return <Loaded key={entityId} entityId={entityId} {...props} />;
}
