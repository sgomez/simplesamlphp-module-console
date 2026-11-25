import { createContext, useCallback, useContext } from 'react';
import { refusalOf, ReportRefusal } from '../database';
import type { Failed } from '../../lib/result';

export type Failure = { status: 403 } | { status: 404; entityId?: string };

export const ReportFailure = createContext<(failure: Failure) => void>(() => undefined);

// True when the status is not the screen's to show: 401 reloads the page, 403 and 404 replace the screen.
export function useFailure(): (status: number, entityId?: string) => boolean {
  const report = useContext(ReportFailure);

  return useCallback(
    (status: number, entityId?: string) => {
      if (status === 403) {
        report({ status });
      } else if (status === 404) {
        report(entityId === undefined ? { status } : { status, entityId });
      }

      return status === 401 || status === 403 || status === 404;
    },
    [report],
  );
}

// A failed API call: 401, 403 and 404 leave the screen, a 503 with the state shows the state page, the rest is the screen's.
export function useSettle(): (failed: Failed, show: (status: number) => void, entityId?: string) => void {
  const fail = useFailure();
  const refuse = useContext(ReportRefusal);

  return useCallback(
    ({ status, body }: Failed, show: (status: number) => void, entityId?: string) => {
      if (fail(status, entityId)) {
        return;
      }
      const refused = refusalOf(status, body);
      if (refused) {
        refuse(refused);
      } else {
        show(status);
      }
    },
    [fail, refuse],
  );
}

// Shows a message such as "Deleted." at the top of the next page, at `to` when given.
export const ReportMessage = createContext<(text: string, to?: string) => void>(() => undefined);
