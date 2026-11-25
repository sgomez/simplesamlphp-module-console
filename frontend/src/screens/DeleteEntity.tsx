import { useContext, useState, type ReactNode } from 'react';
import { postJson } from '../api/client';
import { API } from '../api/paths';
import { ReportOutcome } from '../app/Page';
import { failureText, useSettle } from '../app/settle';
import { Callout } from '../components/ui/Callout';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

// An Unpublished object is in no Snapshot, so no node serves it; whether an Unreadable one is live is unknown.
const SERVED = ' Nodes keep serving it until the next Publication, which withdraws it.';

interface Deletion {
  ask: () => void;
  // The confirmation dialog, and what went wrong with the last attempt.
  element: ReactNode;
}

interface Deleted {
  entityId: string;
  name: string | null;
  state: string | null;
  unreadable: boolean;
}

// Deleting asks first; once done the interface moves to `then` with the one-shot message.
export function useDeleteEntity({ entityId, name, state, unreadable }: Deleted, then: string): Deletion {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<number | null>(null);
  const settle = useSettle();
  const announce = useContext(ReportOutcome);
  const label = name ?? entityId;

  const confirm = async () => {
    setBusy(true);
    const result = await postJson<unknown>(API.spDelete, { entityid: entityId });
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
        title={`Delete ${label}?`}
        text={`${label} is removed from the Console.${unreadable || state === 'Unpublished' ? '' : SERVED}`}
        cancel="Cancel"
        confirm={name === null ? 'Delete' : `Delete ${name}`}
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
