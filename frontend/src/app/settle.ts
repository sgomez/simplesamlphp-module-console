import { useCallback, useContext } from 'react';
import { useFailure } from './failure';
import { refusalOf, ReportRefusal } from './refusals';

interface Failed {
  status: number;
  body: unknown;
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

// status 0: no answer could be read.
export function failureText(lead: string, status: number): string {
  return status === 0 ? `${lead}: the Console could not be reached.` : `${lead}: the server answered ${status}.`;
}
