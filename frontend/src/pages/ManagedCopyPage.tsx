import { externalEntityPath } from '../domain/overrides';
import { ManagedCopy } from '../domain/pasted';

export function ManagedCopyPage() {
  return <ManagedCopy back={externalEntityPath} />;
}
