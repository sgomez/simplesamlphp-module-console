import { useContext, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { postJson } from '../api/client';
import { useFailure } from '../app/failure';
import { ReportOutcome } from '../app/Page';
import { refusalOf, ReportRefusal } from '../app/refusals';
import { Callout } from '../components/ui/Callout';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

interface Deletion {
  ask: () => void;
  // The confirmation dialog, and what went wrong with the last attempt.
  element: ReactNode;
}

// Deleting asks first; once done the interface moves to `then` with the one-shot message.
export function useDeleteEntity(entityId: string, name: string | null, then: string): Deletion {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState<number | null>(null);
  const navigate = useNavigate();
  const fail = useFailure();
  const refuse = useContext(ReportRefusal);
  const announce = useContext(ReportOutcome);
  const label = name ?? entityId;

  const confirm = async () => {
    setOpen(false);
    const result = await postJson<unknown>('/entities/saml20-sp-remote/delete', { entityid: entityId });
    if (result.ok) {
      announce('Deleted.');
      void navigate(then, { replace: true });

      return;
    }
    if (fail(result.status)) {
      return;
    }
    const refused = refusalOf(result.status, result.body);
    if (refused) {
      refuse(refused);
    } else {
      setFailed(result.status);
    }
  };

  const element = (
    <>
      {failed !== null && (
        <Callout
          kind="error"
          title={
            failed === 0 ? 'Not deleted: the Console could not be reached.' : `Not deleted: the server answered ${failed}.`
          }
        />
      )}
      <ConfirmDialog
        open={open}
        title={`Delete ${label}?`}
        text={`${label} is removed from the Console. Nodes keep serving it until the next Publication, which withdraws it.`}
        cancel="Cancel"
        confirm={`Delete ${label}`}
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
