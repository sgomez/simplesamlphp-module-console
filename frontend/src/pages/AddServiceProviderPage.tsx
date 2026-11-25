import { AddEntity, type EditedEntity } from '../domain/entities';

interface AddServiceProviderPageProps {
  onSaved: () => void;
  onTitle: (title: string) => void;
  onCreated: (entity: EditedEntity) => void;
}

export function AddServiceProviderPage(props: AddServiceProviderPageProps) {
  return <AddEntity {...props} />;
}
