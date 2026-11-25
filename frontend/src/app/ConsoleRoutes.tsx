import { useCallback, useState } from 'react';
import { API } from '../api/paths';
import type { Session } from '../api/types';
import { Console, type Outcome } from './Console';
import type { Said } from './Page';
import { useApi } from './useApi';

// Every change asks for the session again through one revision; an outcome also starts the Console afresh.
export function ConsoleRoutes() {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [round, setRound] = useState(0);
  const [revision, setRevision] = useState(0);
  const session = useApi<Session>(API.session, { revision });
  const move = useCallback(
    (at: string | null) => setOutcome((current) => (current === null || at === null ? null : { ...current, at })),
    [],
  );
  const changed = useCallback(() => setRevision((n) => n + 1), []);
  const report = useCallback(
    (said: Said, at: string) => {
      setOutcome({ at, said });
      setRound((n) => n + 1);
      changed();
    },
    [changed],
  );

  return <Console key={round} session={session} outcome={outcome} onOutcome={report} onChange={changed} onMove={move} />;
}
