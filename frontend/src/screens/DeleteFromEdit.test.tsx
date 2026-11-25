import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EDIT, entity, page, posted, refusal, session } from '../test/api';
import { DELETE, ID, chooseDelete, confirmDelete, deletedMessage, gone, withDialogs } from '../test/delete';
import { openEdit } from '../test/edit';
import { location } from '../test/render';
import { LIST, withToken } from '../test/states';

describe('deleting from the edit screen', () => {
  withToken();
  withDialogs();

  it('asks under More actions, saying what will happen, with a button that repeats the verb', async () => {
    const fetch = await openEdit(entity({ state: 'Modified' }), { [DELETE]: gone });

    chooseDelete();

    const dialog = screen.getByRole('dialog', { name: 'Delete Example?' });
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(within(dialog).getByRole('heading', { name: 'Delete Example?' })).toBeDefined();
    expect(
      within(dialog).getByText(
        'Example is removed from the Console. Nodes keep serving it until the next Publication, which withdraws it.',
      ),
    ).toBeDefined();
    expect(within(dialog).getByRole('button', { name: 'Cancel' }).className).toBe('btn btn-secondary');
    expect(within(dialog).getByRole('button', { name: 'Delete Example' }).className).toBe('btn btn-danger-solid');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(posted(fetch, DELETE)).toBeUndefined();
  });

  it('keeps the object on Cancel', async () => {
    const fetch = await openEdit(entity(), { [DELETE]: gone });
    chooseDelete();

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(fetch.mock.calls.some(([input]) => String(input) === DELETE)).toBe(false);
    expect(location()).toBe(EDIT);
  });

  it('deletes with the token and moves to the list with a one-shot message', async () => {
    let deleted = false;
    const fetch = await openEdit(entity(), {
      [DELETE]: () => {
        deleted = true;

        return gone;
      },
      '/api/session': () => ({ body: { ...session, pendingCount: deleted ? 1 : 0 } }),
      [`/api${LIST}`]: { body: page([]) },
    });
    chooseDelete();

    confirmDelete('Example');

    await deletedMessage();
    expect(location()).toBe(LIST);
    expect(posted(fetch, DELETE)).toEqual({ entityid: ID });
    const sent = fetch.mock.calls.find(([input]) => String(input) === DELETE)?.[1]?.headers as Record<string, string>;
    expect(sent['X-Console-Token']).toBe('the-token');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Service providers');
    expect(await screen.findByRole('link', { name: 'Review 1 change' })).toBeDefined();

    fireEvent.click(screen.getByRole('link', { name: /SimpleSAMLphp/ }));
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
  });

  it('names an object without a name by its entity ID', async () => {
    await openEdit(entity({ name: null }), { [DELETE]: gone });

    chooseDelete();

    const dialog = screen.getByRole('dialog', { name: `Delete ${ID}?` });
    expect(within(dialog).getByRole('button', { name: `Delete ${ID}` })).toBeDefined();
    expect(within(dialog).getByText(new RegExp(`^${ID} is removed from the Console\\.`))).toBeDefined();
  });

  it('stays on the screen and says so when the delete fails', async () => {
    await openEdit(entity(), { [DELETE]: { status: 500, body: {} } });
    chooseDelete();

    confirmDelete('Example');

    const alert = await screen.findByRole('alert');
    expect(alert.className).toBe('callout callout-error');
    expect(alert.textContent).toBe('Not deleted: the server answered 500.');
    expect(location()).toBe(EDIT);
    expect(screen.getByRole('textbox', { name: 'PHP' })).toBeDefined();
  });

  it('says so when the Console cannot be reached', async () => {
    await openEdit(entity(), {
      [DELETE]: () => {
        throw new TypeError('offline');
      },
    });
    chooseDelete();

    confirmDelete('Example');

    expect((await screen.findByRole('alert')).textContent).toBe('Not deleted: the Console could not be reached.');
  });

  it('shows Request refused when the token is refused', async () => {
    await openEdit(entity(), { [DELETE]: { status: 403, body: { error: 'refused' } } });
    chooseDelete();

    confirmDelete('Example');

    expect(await screen.findByRole('heading', { name: 'Request refused' })).toBeDefined();
  });

  it('shows the state page when the database stopped being ready', async () => {
    await openEdit(entity(), { [DELETE]: refusal({ state: 'Unreachable', detail: 'gone' }) });
    chooseDelete();

    confirmDelete('Example');

    expect(await screen.findByRole('heading', { name: 'Database unreachable' })).toBeDefined();
  });
});
