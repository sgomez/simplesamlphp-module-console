import { useContext, useState } from 'react';
import { useLocation } from 'react-router';
import { ReportMessage, useLoad, useSettle, type Loaded } from '../session';
import { useHistoryPort, type RollbackPlan } from './history';

export interface Rollback {
  answer: Loaded<RollbackPlan>;
  busy: boolean;
  // The current Snapshot moved while the page was open; the plan shown is the new one.
  moved: boolean;
  failed: number | null;
  confirm: () => void;
}

function targetOf(pathname: string): number {
  return Number(/\/history\/(\d+)\/rollback/.exec(pathname)?.[1] ?? 0);
}

// SPEC 8.5: once done the interface moves to `then` with the one-shot message.
export function useRollback(then: string): Rollback {
  const target = targetOf(useLocation().pathname);
  const port = useHistoryPort();
  const settle = useSettle();
  const announce = useContext(ReportMessage);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [moved, setMoved] = useState(false);
  const [failed, setFailed] = useState<number | null>(null);
  const answer = useLoad(`rollback/${target}`, () => port.plan(target), { revision });

  const confirm = () => {
    if (answer.state !== 'ready') {
      return;
    }
    setBusy(true);
    setFailed(null);
    void port.rollBack(target, answer.data.current).then((result) => {
      setBusy(false);
      if (result.ok) {
        announce(`Snapshot #${target} is live again.`, then);
      } else if (result.status === 409) {
        setMoved(true);
        setRevision((last) => last + 1);
      } else {
        settle(result, setFailed);
      }
    });
  };

  return { answer, busy, moved, failed, confirm };
}
