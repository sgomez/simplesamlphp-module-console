import { useState, type ReactNode } from 'react';
import { ConfirmDialog } from '../../design-system/ConfirmDialog';
import type { Result } from '../../lib/result';
import { plural } from '../../lib/plural';
import { useSettle } from '../session';
import { changeCount } from './counts';
import { discardText } from './labels';
import { usePublicationPort } from './port';
import type { Publish } from './usePublish';

export interface Discard {
  // Absent while the API cannot discard.
  one?: (entityId: string) => void;
  all?: { label: string; ask: () => void; dialog: ReactNode };
}

export function useDiscard({ review, reload, fail }: Publish): Discard {
  const port = usePublicationPort();
  const settle = useSettle();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { discard, discardAll } = port;

  const run = async (request: Promise<Result<unknown>>) => {
    setBusy(true);
    const result = await request;
    setBusy(false);
    setOpen(false);
    if (result.ok) {
      reload();
    } else {
      settle(result, (status) => fail('Not discarded', status));
    }
  };

  if (review === null) {
    return {};
  }
  const count = changeCount(review);

  return {
    ...(discard ? { one: (entityId: string) => void run(discard(entityId)) } : {}),
    ...(discardAll
      ? {
          all: {
            label: `Discard all ${plural(count, 'change', 'changes')}…`,
            ask: () => setOpen(true),
            dialog: (
              <ConfirmDialog
                open={open}
                title={`Discard all ${plural(count, 'change', 'changes')}?`}
                text={discardText(review)}
                cancel="Keep changes"
                confirm={`Discard ${plural(count, 'change', 'changes')}`}
                busy={busy}
                onCancel={() => setOpen(false)}
                onConfirm={() => void run(discardAll(review.hash))}
              />
            ),
          },
        }
      : {}),
  };
}
