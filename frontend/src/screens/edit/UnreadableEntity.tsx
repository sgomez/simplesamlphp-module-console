import { useEffect } from 'react';
import type { EditedEntity } from '../../api/types';
import { Page } from '../../app/Page';
import { SP_LIST } from '../../app/paths';
import { Callout } from '../../components/ui/Callout';
import { Pre } from '../../components/ui/Code';
import { useDeleteEntity } from '../DeleteEntity';
import { EditHeader } from './EditHeader';

// Read-only: the stored bytes as they are (SPEC 10.8), with no form and no PHP view.
export function UnreadableEntity({ entity, onTitle }: { entity: EditedEntity; onTitle: (title: string) => void }) {
  const title = entity.name ?? entity.entityId;
  const deletion = useDeleteEntity(entity, SP_LIST);

  useEffect(() => onTitle(title), [title, onTitle]);

  return (
    <Page width="wide">
      <EditHeader title={title} entityId={entity.entityId} onDelete={deletion.ask} />
      {deletion.element}
      <Callout kind="error" title="Unreadable">
        {entity.error}
      </Callout>
      {entity.raw !== null && <Pre label="Stored bytes">{entity.raw}</Pre>}
    </Page>
  );
}
