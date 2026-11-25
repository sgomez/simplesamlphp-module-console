import { useEffect, useRef } from 'react';
import { Dialog, Heading, Text } from 'react-aria-components';
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

// React Aria's Dialog inside the native modal <dialog>, which keeps the top layer, the backdrop and inertness.
// The native dialog would focus React Aria's container first; the safe choice, Cancel, takes it instead.
export function ConfirmDialog({ open, title, text, cancel, confirm, onCancel, onConfirm, busy = false }: ConfirmDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (element === null || element.open === open) {
      return;
    }
    if (open) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      element.showModal();
      cancelButton.current?.focus();
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
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          cancelUnlessBusy();
        }
      }}
      // Close requests without a key, such as a back gesture.
      onCancel={(event) => {
        event.preventDefault();
        cancelUnlessBusy();
      }}
    >
      <Dialog role="alertdialog">
        <Heading slot="title" level={3} className="h2 wrap-any">
          {title}
        </Heading>
        <Text slot="description" elementType="p" className="small muted dialog-text wrap-any">
          {text}
        </Text>
        <div className="dialog-actions">
          <Button ref={cancelButton} disabled={busy} onPress={cancelUnlessBusy}>
            {cancel}
          </Button>
          <Button variant="danger-solid" loading={busy} onPress={onConfirm}>
            {confirm}
          </Button>
        </div>
      </Dialog>
    </dialog>
  );
}
