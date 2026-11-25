import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { entity, page } from './test/api';
import { DELETE, chooseDelete, confirmDelete, deletedMessage, gone, withDialogs } from './test/delete';
import { openEdit } from './test/edit';
import { location, renderAt } from './test/render';
import { LIST, serveRun, update, withToken } from './test/states';

function openListFromSidebar() {
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: /Service providers/ }));
}

describe('a one-shot message', () => {
  withToken();
  withDialogs();

  it('ends on the first move away, even one to the same screen', async () => {
    serveRun({ outcome: 'Applied', applied: [7, 8, 9], failed: null, reason: null }, null);
    renderAt(LIST);

    await update();
    await screen.findByRole('heading', { name: 'Service providers' });
    expect(screen.getByRole('status').textContent).toBe('Migrations applied: 7, 8, 9.');

    openListFromSidebar();

    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
  });

  it('ends Deleted when the list it landed on is opened again', async () => {
    await openEdit(entity(), { [DELETE]: gone, [`/api${LIST}`]: { body: page([]) } });
    await chooseDelete();
    confirmDelete('Example');
    await deletedMessage();

    openListFromSidebar();

    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
    expect(location()).toBe(LIST);
  });

  it('is carried along the redirect from the front page', async () => {
    serveRun({ outcome: 'Applied', applied: [7], failed: null, reason: null }, null);
    renderAt('/');

    await update();

    await waitFor(() => expect(location()).toBe(LIST));
    expect((await screen.findByRole('status')).textContent).toBe('Migrations applied: 7.');
  });
});
