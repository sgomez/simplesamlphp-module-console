import { useEffect } from 'react';
import type { EditedEntity } from '../../api/types';
import { Page } from '../../app/Page';
import { Callout } from '../../components/ui/Callout';
import { EditHeader } from './EditHeader';

// Read-only: the raw bytes view of SPEC 10.8 is not in Milestone 1.
export function UnreadableEntity({ entity, onTitle }: { entity: EditedEntity; onTitle: (title: string) => void }) {
  const title = entity.name ?? entity.entityId;

  useEffect(() => onTitle(title), [title, onTitle]);

  return (
    <Page wide>
      <EditHeader title={title} entityId={entity.entityId} />
      <Callout kind="error" title="Unreadable">
        {entity.error}
      </Callout>
    </Page>
  );
}
