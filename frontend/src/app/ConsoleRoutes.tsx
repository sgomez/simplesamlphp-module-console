import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { API } from './http/paths';
import type { Session } from '../domain/session';
import { Console, type Outcome } from './Console';
import { CARRY, type Said } from './Page';
import { useApi } from './useApi';

// Every change asks for the session again through one revision; an outcome also starts the Console afresh.
export function ConsoleRoutes() {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [round, setRound] = useState(0);
  const [revision, setRevision] = useState(0);
  const session = useApi<Session>(API.session, { revision });
  const navigate = useNavigate();
  const move = useCallback(
    (at: string | null) => setOutcome((current) => (current === null || at === null ? null : { ...current, at })),
    [],
  );
  const changed = useCallback(() => setRevision((n) => n + 1), []);
  const report = useCallback(
    (said: Said, at: string, to?: string) => {
      setOutcome({ at, said });
      setRound((n) => n + 1);
      changed();
      if (to !== undefined) {
        void navigate(to, { replace: true, state: CARRY });
      }
    },
    [changed, navigate],
  );

  return <Console key={round} session={session} outcome={outcome} onOutcome={report} onChange={changed} onMove={move} />;
}
