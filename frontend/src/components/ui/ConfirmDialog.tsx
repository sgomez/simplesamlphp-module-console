import { useEffect, useRef } from 'react';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  text: string;
  cancel: string;
  confirm: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({ open, title, text, cancel, confirm, onCancel, onConfirm }: ConfirmDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (element === null || element.open === open) {
      return;
    }
    if (open) {
      element.showModal();
    } else {
      element.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="card dialog"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <h3 className="h2">{title}</h3>
      <p className="small muted dialog-text">{text}</p>
      <div className="dialog-actions">
        <Button onClick={onCancel}>{cancel}</Button>
        <Button variant="danger-solid" onClick={onConfirm}>
          {confirm}
        </Button>
      </div>
    </dialog>
  );
}
