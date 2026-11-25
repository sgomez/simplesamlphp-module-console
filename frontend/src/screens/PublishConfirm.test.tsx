import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { review, session, stubApi } from '../test/api';
import { PUBLISH, calls, ready, servePublication, shown } from '../test/publication';
import { renderAt } from '../test/render';

describe('the confirming request of the Publish screen', () => {
  it('publishes with the hash and the comment, then says so and shows what is now live', async () => {
    const fetch = servePublication([ready, review({ current: { number: 42, createdAt: null }, nextNumber: 43 })]);
    const panel = await shown();

    fireEvent.change(within(panel).getByRole('textbox'), { target: { value: 'New SPs' } });
    fireEvent.click(within(panel).getByRole('button', { name: 'Publish 4 changes' }));

    const done = await screen.findByText('Snapshot 42 published');
    expect(done.closest('.callout')?.className).toBe('callout callout-success');
    expect(await screen.findByText('Everything saved is live in Snapshot #42.')).toBeDefined();
    expect(calls(fetch, '/api/publication', 'POST')[0]?.[1]?.body).toBe('{"hash":"h1","comment":"New SPs"}');
    await waitFor(() => expect(calls(fetch, '/api/session')).toHaveLength(2));
  });

  it('says the Publication was made but this node could not build it', async () => {
    servePublication([ready, review()], { body: { number: 42, build: 'This node could not build it: disk full.' } });
    const panel = await shown();

    fireEvent.click(within(panel).getByRole('button', { name: /Publish/ }));

    const done = await screen.findByText('Snapshot 42 published');
    expect(done.closest('.callout')?.className).toBe('callout callout-warning');
    expect(screen.getByText('This node could not build it: disk full.')).toBeDefined();
  });

  it('shows the current changes with a message, keeping the comment, when they moved', async () => {
    const moved = review({ ...ready, groups: ready.groups.slice(0, 1), hash: 'h2' });
    const fetch = servePublication([ready], { status: 409, body: { error: 'moved', review: moved } });
    const panel = await shown();

    fireEvent.change(within(panel).getByRole('textbox'), { target: { value: 'Why' } });
    fireEvent.click(within(panel).getByRole('button', { name: 'Publish 4 changes' }));

    expect(await screen.findByText('The changes moved while this page was open')).toBeDefined();
    expect(screen.getByRole('heading', { name: '1 change' })).toBeDefined();
    expect(screen.queryByText('Ready to publish')).toBeNull();
    expect((within(panel).getByRole('textbox') as HTMLTextAreaElement).value).toBe('Why');
    await waitFor(() => expect(calls(fetch, '/api/session')).toHaveLength(2));

    fireEvent.click(within(panel).getByRole('button', { name: 'Publish 1 change' }));
    await waitFor(() => expect(calls(fetch, '/api/publication', 'POST')[1]?.[1]?.body).toBe('{"hash":"h2","comment":"Why"}'));
  });

  it('says the changes moved and shows the new problem that blocks the confirming request', async () => {
    const blocked = review({ ...ready, canPublish: false, problems: [{ entityId: null, message: 'Too large.', edit: null }] });
    servePublication([ready], { status: 422, body: { error: 'blocked', problems: blocked.problems, review: blocked } });
    const panel = await shown();

    fireEvent.click(within(panel).getByRole('button', { name: 'Publish 4 changes' }));

    expect(await screen.findByText('1 problem blocks publishing')).toBeDefined();
    expect(screen.getByText('The changes moved while this page was open')).toBeDefined();
    expect((within(panel).getByRole('button', { name: 'Publish 4 changes' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows the button busy while the request runs, and leaves the screen as it was when it fails', async () => {
    servePublication([ready], { status: 415, body: { error: 'unsupported media type' } });
    const panel = await shown();
    const button = within(panel).getByRole('button', { name: 'Publish 4 changes' }) as HTMLButtonElement;

    fireEvent.click(button);

    expect(button.className).toBe('btn btn-primary is-loading');
    expect(button.disabled).toBe(true);
    await waitFor(() => expect(button.disabled).toBe(false));
    expect(screen.getByText('Ready to publish')).toBeDefined();
  });

  it('shows only the title while the review loads or when the API refuses it', async () => {
    const fetch = stubApi({ '/api/session': { body: session }, '/api/publication': { status: 503, body: {} } });
    const { container } = renderAt(PUBLISH);

    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe('Publish');
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(container.querySelector('main')?.childElementCount).toBe(1);
  });
});
