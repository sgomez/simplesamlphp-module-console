import { useContext, useState } from 'react';
import { useSearchParams } from 'react-router';
import { editPath } from '../entities';
import { ReportMessage, useLoad, useSettle, type Loaded } from '../session';
import { useOverridesPort, type OverrideComparison } from './port';

export interface Comparison {
  entityId: string;
  answer: Loaded<OverrideComparison>;
  busy: boolean;
  failed: number | null;
  markReviewed: () => void;
}

// SPEC 9.4: Mark as reviewed returns to the edit screen with the one-shot message.
export function useComparison(): Comparison {
  const entityId = useSearchParams()[0].get('entityid') ?? '';
  const port = useOverridesPort();
  const settle = useSettle();
  const announce = useContext(ReportMessage);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<number | null>(null);
  const answer = useLoad(`override/${entityId}`, () => port.compare(entityId), { entityId });

  const markReviewed = () => {
    setBusy(true);
    setFailed(null);
    void port.markReviewed(entityId).then((result) => {
      setBusy(false);
      if (result.ok) {
        announce('Marked as reviewed.', editPath(entityId));
      } else {
        settle(result, setFailed, entityId);
      }
    });
  };

  return { entityId, answer, busy, failed, markReviewed };
}
