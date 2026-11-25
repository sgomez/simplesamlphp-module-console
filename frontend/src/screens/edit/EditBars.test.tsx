import { fireEvent, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PHP, entity } from '../../app/test/api';
import { editor, openEdit, saveBar } from '../../app/test/edit';

describe('the bars of the edit screen', () => {
  it('copies and downloads what is in the editor', async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    await openEdit();
    const bar = document.querySelector('.ed-bar') as HTMLElement;

    fireEvent.change(editor(), { target: { value: 'typed' } });
    fireEvent.click(within(bar).getByRole('button', { name: 'Copy' }));
    fireEvent.click(within(bar).getByRole('button', { name: 'Download' }));

    expect(writeText).toHaveBeenCalledWith('typed');
    expect(click).toHaveBeenCalledOnce();
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe('saml20-sp-remote.php');
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x'));
  });

  it('shows the state in the save bar and offers no Save before an edit', async () => {
    await openEdit(entity({ state: 'Modified' }));

    expect(within(saveBar()).getByText('Modified').parentElement?.className).toBe('status s-pending');
    expect(within(saveBar()).getByRole('button', { name: 'Save' }).hasAttribute('disabled')).toBe(true);
    expect(within(saveBar()).queryByRole('button', { name: 'Discard edits' })).toBeNull();
  });

  it('says Unpublished as the list does', async () => {
    await openEdit(entity({ state: 'Unpublished' }));
    expect(within(saveBar()).getByText('Unpublished').parentElement?.className).toBe('status s-pending');
  });

  it('says Up to date for an entity as published', async () => {
    await openEdit(entity({ state: 'Up to date' }));

    expect(within(saveBar()).getByText('Up to date').parentElement?.className).toBe('status s-live');
  });

  it('marks edits as unsaved and discards them back to the saved text', async () => {
    await openEdit();

    fireEvent.change(editor(), { target: { value: `${PHP}\n` } });

    expect(within(saveBar()).getByText('Unsaved edits').parentElement?.className).toBe('status s-unsaved');
    expect(within(saveBar()).getByRole('button', { name: 'Save' }).hasAttribute('disabled')).toBe(false);
    fireEvent.click(within(saveBar()).getByRole('button', { name: 'Discard edits' }));
    expect(editor().value).toBe(PHP);
    expect(within(saveBar()).queryByText('Unsaved edits')).toBeNull();
  });
});
