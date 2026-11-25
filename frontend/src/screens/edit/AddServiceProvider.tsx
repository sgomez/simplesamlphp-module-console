import { useNavigate } from 'react-router';
import type { EditedEntity } from '../../api/types';
import { SP_EDIT, SP_LIST } from '../../app/paths';
import { useApi } from '../../app/useApi';
import { EntityEditor } from './EntityEditor';

interface AddServiceProviderProps {
  pending: number;
  onSaved: () => void;
  onTitle: (title: string) => void;
  onCreated: (entity: EditedEntity) => void;
}

// The edit screen of an object not saved yet, opened on the starter text of the set.
export function AddServiceProvider({ onCreated, ...props }: AddServiceProviderProps) {
  const navigate = useNavigate();
  const answer = useApi<EditedEntity>('/entities/saml20-sp-remote/entity');
  if (answer.state !== 'ready') {
    return null;
  }

  return (
    <EntityEditor
      initial={answer.data}
      {...props}
      onCancel={() => void navigate(SP_LIST)}
      onCreated={(entity) => {
        onCreated(entity);
        void navigate(`${SP_EDIT}?entityid=${encodeURIComponent(entity.entityId)}`);
      }}
    />
  );
}
