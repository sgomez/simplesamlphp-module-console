import { Page } from '../design-system/Page';
import { NODES } from '../domain/nodes';
import { RollbackBar, RollbackReview, useRollback } from '../domain/publication';

export function RollbackPage() {
  const rollback = useRollback(NODES);

  return (
    <Page width="slim" bar={<RollbackBar rollback={rollback} />}>
      <RollbackReview rollback={rollback} />
    </Page>
  );
}
