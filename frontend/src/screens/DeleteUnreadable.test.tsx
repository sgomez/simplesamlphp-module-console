import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EDIT, ENTITY, entity, page, posted, session, sp, stubApi } from '../test/api';
import { BAD, DELETE, ID, chooseDelete, confirmDelete, deletedMessage, gone, withDialogs } from '../test/delete';
import { location, renderAt } from '../test/render';
import { LIST, withToken } from '../test/states';

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

    chooseDelete();
    confirmDelete(ID);

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
    fireEvent.click(within(dialog).getByRole('button', { name: `Delete ${BAD}` }));

    await deletedMessage();
    expect(posted(fetch, DELETE)).toEqual({ entityid: BAD });
    expect(location()).toBe(`${LIST}?q=example`);
    await waitFor(() => expect(screen.queryByText('Unreadable')).toBeNull());
  });
});
