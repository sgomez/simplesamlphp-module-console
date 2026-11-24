import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  });
});

function dialog(open: boolean, onCancel = vi.fn(), onConfirm = vi.fn()) {
  return (
    <ConfirmDialog
      open={open}
      title="Discard all 7 changes?"
      text="This cannot be undone."
      cancel="Keep changes"
      confirm="Discard 7 changes"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}

describe('ConfirmDialog', () => {
  it('opens as a modal that says what will happen, with a button that repeats the verb', () => {
    render(dialog(true));

    const element = screen.getByRole('dialog', { name: 'Discard all 7 changes?' });
    expect(element.className).toBe('card dialog');
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
    expect(screen.getByText('This cannot be undone.').className).toBe('small muted dialog-text');
    expect(screen.getByRole('button', { name: 'Discard 7 changes' }).className).toBe('btn btn-danger-solid');
  });

  it('answers each button and Escape', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(dialog(true, onCancel, onConfirm));

    fireEvent.click(screen.getByRole('button', { name: 'Keep changes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Discard 7 changes' }));
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));

    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('closes when it is no longer open, and stays closed', () => {
    const { rerender } = render(dialog(true));

    rerender(dialog(false));
    rerender(dialog(false));

    expect(HTMLDialogElement.prototype.close).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
