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

function dialog(open: boolean, onCancel = vi.fn(), onConfirm = vi.fn(), busy = false) {
  return (
    <ConfirmDialog
      open={open}
      title="Discard all 7 changes?"
      text="This cannot be undone."
      cancel="Keep changes"
      confirm="Discard 7 changes"
      onCancel={onCancel}
      onConfirm={onConfirm}
      busy={busy}
    />
  );
}

describe('ConfirmDialog', () => {
  it('opens as a modal that says what will happen, with a button that repeats the verb', () => {
    render(dialog(true));

    const element = screen.getByRole('dialog', { name: 'Discard all 7 changes?' });
    expect(element.className).toBe('card dialog');
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
    const text = screen.getByText('This cannot be undone.');
    expect(text.className).toBe('small muted dialog-text wrap-any');
    expect(element.getAttribute('aria-describedby')).toBe(text.id);
    expect(screen.getByRole('heading', { name: 'Discard all 7 changes?' }).className).toBe('h2 wrap-any');
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

  it('keeps the confirming button loading and ignores Cancel and Escape while busy', () => {
    const onCancel = vi.fn();
    render(dialog(true, onCancel, vi.fn(), true));

    const confirm = screen.getByRole('button', { name: 'Discard 7 changes' });
    fireEvent.click(screen.getByRole('button', { name: 'Keep changes' }));
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));

    expect(confirm.getAttribute('data-pending')).toBe('true');
    expect((confirm as HTMLButtonElement).disabled).toBe(true);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('hands the focus back to what had it once closed', () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const { rerender } = render(dialog(true));
    screen.getByRole('button', { name: 'Keep changes' }).focus();

    rerender(dialog(false));

    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
