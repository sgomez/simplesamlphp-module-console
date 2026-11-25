import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { refusal, review } from '../test/api';
import { ready, servePublication, shown } from '../test/publication';

describe('a refused confirming request', () => {
  it('replaces the screen with Request refused when the token is refused', async () => {
    servePublication([ready], { status: 403, body: { error: 'refused' } });
    const panel = await shown();

    fireEvent.click(within(panel).getByRole('button', { name: 'Publish 4 changes' }));

    expect(await screen.findByRole('heading', { name: 'Request refused' })).toBeDefined();
    expect(screen.queryByRole('complementary')).toBeNull();
  });

  it('replaces the screen with the state page when the database is not ready', async () => {
    servePublication([ready], refusal({ state: 'Unreachable' }));
    const panel = await shown();

    fireEvent.click(within(panel).getByRole('button', { name: 'Publish 4 changes' }));

    expect(await screen.findByRole('heading', { name: 'Database unreachable' })).toBeDefined();
    expect(screen.queryByRole('complementary')).toBeNull();
  });

  it.each([
    [0, 'Not published: the Console could not be reached.'],
    [503, 'Not published: the server answered 503.'],
    [415, 'Not published: the server answered 415.'],
  ])('says why nothing was published after a %i, keeping the screen', async (status, message) => {
    servePublication([ready], { status, body: {} });
    const panel = await shown();

    fireEvent.click(within(panel).getByRole('button', { name: 'Publish 4 changes' }));

    expect((await screen.findByRole('alert')).textContent).toBe(message);
    expect(within(panel).getByRole('button', { name: 'Publish 4 changes' })).toBeDefined();
  });

  it('shows no change of the earlier review once a Publication after a move succeeds', async () => {
    const moved = review({ ...ready, groups: ready.groups.slice(0, 1), hash: 'h2' });
    const fetch = servePublication([ready, review()], { status: 409, body: { code: 'moved', review: moved } });
    const panel = await shown();
    fireEvent.click(within(panel).getByRole('button', { name: 'Publish 4 changes' }));
    await screen.findByText('The changes moved while this page was open');
    fetch.mockImplementationOnce(async () => new Response('{"number":42,"build":null}', { status: 200 }));

    fireEvent.click(within(panel).getByRole('button', { name: 'Publish 1 change' }));

    await screen.findByText('Snapshot 42 published');
    expect(screen.queryByRole('complementary')).toBeNull();
    expect(await screen.findByRole('heading', { name: 'Nothing to publish' })).toBeDefined();
  });
});
