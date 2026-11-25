import { Page } from '../design-system/Page';
import { ExternalEntityView, ManagedCopyBar, useExternalEntity } from '../domain/overrides';

export function ExternalEntityPage() {
  const detail = useExternalEntity();
  const { answer } = detail;

  return (
    <Page bar={answer.state === 'ready' && <ManagedCopyBar entity={answer.data} />}>
      <ExternalEntityView detail={detail} />
    </Page>
  );
}
