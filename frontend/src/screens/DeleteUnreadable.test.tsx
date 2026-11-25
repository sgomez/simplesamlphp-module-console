import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EDIT, ENTITY, entity, page, posted, session, sp, stubApi } from '../app/test/api';
import { BAD, DELETE, ID, chooseDelete, confirmDelete, deletedMessage, gone, withDialogs } from '../app/test/delete';
import { location, renderAt } from '../app/test/render';
import { LIST, withToken } from '../app/test/states';

describe('deleting an Unreadable object', () => {
  withToken();
  withDialogs();

  it('offers Delete on the Unreadable entity screen', async () => {
    const fetch = stubApi({
      '/api/session': { body: session },
      [ENTITY]: { body: entity({ php: null, name: null, unreadable: true, error: 'The document is not valid JSON.' }) },
      [DELETE]: gone,
      [`/api${LIST}`]: { body: page([]) },
    });
    renderAt(EDIT);
    await screen.findByRole('alert');

    await chooseDelete();
    confirmDelete(null);

    await deletedMessage();
    expect(posted(fetch, DELETE)).toEqual({ entityid: ID });
    expect(location()).toBe(LIST);
  });

  it('offers Delete on an Unreadable row of the list, and only there', async () => {
    let deleted = false;
    const unreadable = sp(BAD, { state: null, unreadable: true, error: 'The stored document is not valid JSON.' });
    const fetch = stubApi({
      '/api/session': { body: session },
      [`/api${LIST}`]: () => ({ body: page(deleted ? [sp(ID)] : [unreadable, sp(ID)], { query: 'example' }) }),
      [DELETE]: () => {
        deleted = true;

        return { body: { entityid: BAD } };
      },
    });
    renderAt(`${LIST}?q=example`);
    const row = (await screen.findByText('Unreadable')).closest('.row') as HTMLElement;

    expect(screen.getAllByRole('button', { name: 'Delete…' })).toHaveLength(1);
    const offer = within(row).getByRole('button', { name: 'Delete…' });
    expect(offer.className).toBe('btn btn-danger btn-sm');

    fireEvent.click(offer);
    const dialog = screen.getByRole('dialog', { name: `Delete ${BAD}?` });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await deletedMessage();
    expect(posted(fetch, DELETE)).toEqual({ entityid: BAD });
    expect(location()).toBe(`${LIST}?q=example`);
    await waitFor(() => expect(screen.queryByText('Unreadable')).toBeNull());
  });

  it('keeps the status column where readable rows have it, and reports a failure below the row', async () => {
    const unreadable = sp(BAD, { unreadable: true, error: 'The stored document is not valid JSON.' });
    stubApi({
      '/api/session': { body: session },
      [`/api${LIST}`]: { body: page([unreadable, sp(ID)]) },
      [DELETE]: { status: 500, body: {} },
    });
    renderAt(LIST);
    const row = (await screen.findByText('Unreadable')).closest('.row') as HTMLElement;
    const readable = screen.getByRole('link', { name: (name) => name.includes(ID) });

    expect(row.lastElementChild?.className).toBe('row-slot');
    expect(readable.lastElementChild?.className).toBe('row-slot');
    expect(row.querySelector('.row-slot button')?.textContent).toBe('Delete…');

    fireEvent.click(within(row).getByRole('button', { name: 'Delete…' }));
    confirmDelete(null);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('Not deleted: the server answered 500.');
    expect(alert.closest('.row')).toBeNull();
    expect(row.nextElementSibling).toBe(alert);
  });
});
