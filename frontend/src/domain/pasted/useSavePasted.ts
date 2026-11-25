import { useContext, useState } from 'react';
import type { Result } from '../../lib/result';
import { listRoute, useEntitiesPort, type Draft } from '../entities';
import { ReportMessage, useSettle } from '../session';
import { usePastedPort } from './port';
import type { Target } from './types';

export type SaveTrouble = { kind: 'failed'; status: number } | { kind: 'invalid'; errors: string[] } | { kind: 'race' };

export const AUTHSOURCES = '/authsources';

// Saves what was read or replaced, as a create or an edit, and moves to the screen that follows with "Saved.".
export function useSavePasted(target: Target, after?: string) {
  const entities = useEntitiesPort();
  const pasted = usePastedPort();
  const settle = useSettle();
  const announce = useContext(ReportMessage);
  const [saving, setSaving] = useState(false);
  const [trouble, setTrouble] = useState<SaveTrouble | null>(null);
  const next = after ?? (target.kind === 'entity' ? listRoute(target.set) : AUTHSOURCES);
  const fail = (failed: Result<unknown> & { ok: false }) => settle(failed, (status) => setTrouble({ kind: 'failed', status }));

  const save = async (draft: Draft) => {
    setSaving(true);
    setTrouble(null);
    if (target.kind === 'authsource') {
      const result = await pasted.createAuthsource(draft.php);
      setSaving(false);
      if (result.ok) {
        announce('Saved.', next);
      } else {
        fail(result);
      }

      return;
    }
    const result = await entities.save(draft);
    setSaving(false);
    switch (result.kind) {
      case 'saved':
        announce('Saved.', next);
        break;
      case 'race':
        setTrouble({ kind: 'race' });
        break;
      case 'invalid':
        setTrouble({ kind: 'invalid', errors: result.refusal.errors.map(({ message }) => message) });
        break;
      case 'failed':
        fail({ ok: false, ...result.failed });
    }
  };

  return { saving, trouble, save, done: () => announce('Saved.', next) };
}
