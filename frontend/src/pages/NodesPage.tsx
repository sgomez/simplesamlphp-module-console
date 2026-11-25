import { Page } from '../design-system/Page';
import { Nodes } from '../domain/nodes';

export function NodesPage() {
  return (
    <Page width="slim">
      <h1 className="h1">Nodes</h1>
      <Nodes />
    </Page>
  );
}
