import { useState } from 'react';
import type { Failed } from '../../lib/result';
import { useDatabasePort } from './port';
import type { MigrationRun } from './types';

// Leaves the page on 401, 403, 404 and 503, and calls show for any other failure.
export type Settle = (failed: Failed, show: (status: number) => void) => void;

export interface Migrate {
  running: boolean;
  // The status of a run the server did not carry out: no answer, or one that is not a run.
  failed: number | null;
  update: () => void;
}

export function useMigrate(settle: Settle, onRun: (run: MigrationRun) => void): Migrate {
  const port = useDatabasePort();
  const [running, setRunning] = useState(false);
  const [failed, setFailed] = useState<number | null>(null);

  const update = () => {
    setRunning(true);
    setFailed(null);
    void port.migrate().then((result) => {
      setRunning(false);
      if (result.ok) {
        onRun(result.data);
      } else {
        settle(result, setFailed);
      }
    });
  };

  return { running, failed, update };
}
