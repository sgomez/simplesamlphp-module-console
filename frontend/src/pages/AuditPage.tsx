import { Page } from '../design-system/Page';
import { AuditTrail, useAuditTrail } from '../domain/audit';
import { HistoryTabs } from '../domain/publication';

export function AuditPage() {
  const trail = useAuditTrail();

  return (
    <Page>
      <h1 className="h1">History</h1>
      <HistoryTabs current="audit" />
      <AuditTrail trail={trail} />
    </Page>
  );
}
