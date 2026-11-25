import { useContext, useState, type ReactNode } from 'react';
import { Callout } from '../../design-system/Callout';
import { ConfirmDialog } from '../../design-system/ConfirmDialog';
import { failureText } from '../../lib/failureText';
import { ReportMessage, useSettle } from '../session';
import { useEntitiesPort } from './port';

interface Deletion {
  ask: () => void;
  // The confirmation dialog, and what went wrong with the last attempt.
  element: ReactNode;
}

interface Deleted {
  entityId: string;
  name: string | null;
  inSnapshot: boolean;
}

// SPEC 10.9: nodes serve an object until a Publication withdraws it, so only one in the current Snapshot says so.
function deleteTexts({ entityId, name, inSnapshot }: Deleted): { title: string; text: string; confirm: string } {
  const label = name ?? entityId;
  const served = inSnapshot ? ' Nodes keep serving it until the next Publication, which withdraws it.' : '';

  return { title: `Delete ${label}?`, text: `${label} is removed from the Console.${served}`, confirm: `Delete ${label}` };
}

// Deleting asks first; once done the interface moves to `then` with the one-shot message.
export function useDeleteEntity(deleted: Deleted, then: string): Deletion {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<number | null>(null);
  const settle = useSettle();
  const announce = useContext(ReportMessage);
  const port = useEntitiesPort();

  const confirm = async () => {
    setBusy(true);
    const result = await port.remove(deleted.entityId);
    setBusy(false);
    setOpen(false);
    if (result.ok) {
      announce('Deleted.', then);

      return;
    }
    settle(result, setFailed);
  };

  const element = (
    <>
      {failed !== null && <Callout kind="error" title={failureText('Not deleted', failed)} />}
      <ConfirmDialog
        open={open}
        {...deleteTexts(deleted)}
        cancel="Cancel"
        busy={busy}
        onCancel={() => setOpen(false)}
        onConfirm={() => void confirm()}
      />
    </>
  );

  return {
    ask: () => {
      setFailed(null);
      setOpen(true);
    },
    element,
  };
}
