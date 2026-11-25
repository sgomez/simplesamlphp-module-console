import { useCallback, useState } from 'react';
import { Console, type Outcome } from './Console';
import type { Said } from './Page';

export function ConsoleRoutes() {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [round, setRound] = useState(0);
  const move = useCallback(
    (at: string | null) => setOutcome((current) => (current === null || at === null ? null : { ...current, at })),
    [],
  );
  const report = useCallback((said: Said, at: string) => {
    setOutcome({ at, said });
    setRound((n) => n + 1);
  }, []);

  return <Console key={round} outcome={outcome} onOutcome={report} onMove={move} />;
}
