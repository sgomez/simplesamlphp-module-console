import { useEffect, useId, useRef } from 'react';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  text: string;
  cancel: string;
  confirm: string;
  onCancel: () => void;
  onConfirm: () => void;
  // The confirmed request is running: the dialog waits for its answer.
  busy?: boolean;
}

export function ConfirmDialog({ open, title, text, cancel, confirm, onCancel, onConfirm, busy = false }: ConfirmDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const textId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (element === null || element.open === open) {
      return;
    }
    if (open) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      element.showModal();
    } else {
      element.close();
      opener.current?.focus();
    }
  }, [open]);

  const cancelUnlessBusy = () => {
    if (!busy) {
      onCancel();
    }
  };

  return (
    <dialog
      ref={dialog}
      className="card dialog"
      aria-label={title}
      aria-describedby={textId}
      onCancel={(event) => {
        event.preventDefault();
        cancelUnlessBusy();
      }}
    >
      <h3 className="h2 wrap-any">{title}</h3>
      <p id={textId} className="small muted dialog-text wrap-any">
        {text}
      </p>
      <div className="dialog-actions">
        <Button disabled={busy} onPress={cancelUnlessBusy}>
          {cancel}
        </Button>
        <Button variant="danger-solid" loading={busy} disabled={busy} onPress={onConfirm}>
          {confirm}
        </Button>
      </div>
    </dialog>
  );
}
