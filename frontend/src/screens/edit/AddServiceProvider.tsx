import { useContext } from 'react';
import { useNavigate } from 'react-router';
import type { EditedEntity } from '../../api/types';
import { ReportOutcome } from '../../app/Page';
import { editPath, SP_LIST } from '../../app/paths';
import { useApi } from '../../app/useApi';
import { EntityEditor } from './EntityEditor';

interface AddServiceProviderProps {
  pending: number;
  onSaved: () => void;
  onTitle: (title: string) => void;
}

// The edit screen of an object not saved yet, opened on the starter text of the set.
export function AddServiceProvider(props: AddServiceProviderProps) {
  const navigate = useNavigate();
  const announce = useContext(ReportOutcome);
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
        announce({ created: entity });
        void navigate(editPath(entity.entityId), { replace: true });
      }}
    />
  );
}
