import { Page } from '../design-system/Page';
import { DatabaseState, type DatabaseRefusal, type MigrationRun } from '../domain/database';
import { useSettle } from '../domain/session';

interface DatabaseStatePageProps {
  refusal: DatabaseRefusal;
  run: MigrationRun | null;
  onRun: (run: MigrationRun) => void;
}

export function DatabaseStatePage({ refusal, run, onRun }: DatabaseStatePageProps) {
  const settle = useSettle();

  return (
    <Page width="narrow">
      <DatabaseState refusal={refusal} run={run} settle={settle} onRun={onRun} />
    </Page>
  );
}
