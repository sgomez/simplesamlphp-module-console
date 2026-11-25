import { Page } from '../design-system/Page';
import { ExternalEntities, ImportBar, useExternalList } from '../domain/overrides';

export function ExternalPage() {
  const list = useExternalList();

  return (
    <Page bar={<ImportBar list={list} />}>
      <ExternalEntities list={list} />
    </Page>
  );
}
