import { Page } from '../design-system/Page';
import { OverviewView, useOverview } from '../domain/overview';

export function OverviewPage() {
  const overview = useOverview();

  return (
    <Page width="slim">
      <h1 className="h1">Overview</h1>
      <OverviewView overview={overview} />
    </Page>
  );
}
