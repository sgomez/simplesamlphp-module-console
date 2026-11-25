import { StoredEntity, type EditedEntity } from '../domain/entities';
import { ReviewChanges } from '../domain/publication';

interface EditServiceProviderPageProps {
  pending: number;
  // The entity a create has just answered, which the page shows as saved.
  created: EditedEntity | null;
  onSaved: () => void;
  onTitle: (title: string) => void;
}

export function EditServiceProviderPage({ pending, ...props }: EditServiceProviderPageProps) {
  return <StoredEntity review={pending > 0 && <ReviewChanges count={pending} variant="secondary" />} {...props} />;
}
