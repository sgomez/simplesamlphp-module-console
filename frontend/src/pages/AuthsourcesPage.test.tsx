import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { authsource } from '../app/adapters/memory/authsources';
import { withDialogs } from '../app/test/delete';
import { renderScreen } from '../app/test/screens';

const unreadable = authsource('mystery', 'saml:SP', { state: 'Unreadable', unreadable: true, error: 'Not JSON.' });

describe('Authsources', () => {
  withDialogs();

  it('deletes an Unreadable authsource and lists the rest again', async () => {
    renderScreen('/authsources', { authsources: { list: { managed: [unreadable, authsource('guest-sql', 'sqlauth:SQL2')], file: [] } } });

    fireEvent.click(await screen.findByRole('button', { name: 'Delete…' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete mystery' }));

    expect(await screen.findByText('Deleted.')).toBeTruthy();
    await waitFor(() => expect(screen.queryByText('mystery')).toBeNull());
    expect(screen.getByText('guest-sql')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'From authsources.php' })).toBeNull();
  });

  it('keeps the row and says why when the delete fails', async () => {
    renderScreen('/authsources', { authsources: { list: { managed: [unreadable], file: [] }, removal: { status: 500, body: null } } });

    fireEvent.click(await screen.findByRole('button', { name: 'Delete…' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete mystery' }));

    expect(await screen.findByText('Not deleted: the server answered 500.')).toBeTruthy();
    expect(screen.getByText('mystery')).toBeTruthy();
  });

  it('shows nothing of a list that did not load', async () => {
    const { container } = renderScreen('/authsources', { authsources: { failure: { status: 500, body: null } } });

    await screen.findByRole('heading', { name: 'Authsources', level: 1 });
    expect(container.querySelector('main .card')).toBeNull();
  });
});
