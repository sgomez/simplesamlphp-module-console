import { useContext } from 'react';
import { useNavigate } from 'react-router';
import { editPath, NewEntity, SP_LIST } from '../../domain/entities';
import { ReportOutcome } from '../../app/Page';

interface AddServiceProviderProps {
  onSaved: () => void;
  onTitle: (title: string) => void;
}

export function AddServiceProvider(props: AddServiceProviderProps) {
  const navigate = useNavigate();
  const announce = useContext(ReportOutcome);

  return (
    <NewEntity
      {...props}
      onCancel={() => void navigate(SP_LIST)}
      onCreated={(entity) => {
        announce({ created: entity }, editPath(entity.entityId));
      }}
    />
  );
}
