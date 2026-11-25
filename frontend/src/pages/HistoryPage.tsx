import { Page } from '../design-system/Page';
import { HistoryTabs, Snapshots } from '../domain/publication';

export function HistoryPage() {
  return (
    <Page width="slim">
      <h1 className="h1">History</h1>
      <HistoryTabs current="snapshots" />
      <Snapshots />
    </Page>
  );
}
