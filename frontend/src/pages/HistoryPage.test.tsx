import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderScreen, screenPath } from '../app/test/screens';

describe('History', () => {
  it('lists the retained Snapshots and leads to the Rollback of one', async () => {
    renderScreen('/history');

    fireEvent.click((await screen.findAllByRole('link', { name: 'Roll back to this' }))[0] as HTMLElement);

    expect(await screen.findByRole('heading', { name: 'Roll back to Snapshot #40' })).toBeTruthy();
    expect(screenPath()).toBe('/history/40/rollback');
  });

  it('opens the Audit trail tab', async () => {
    renderScreen('/history');

    fireEvent.click(await screen.findByRole('link', { name: 'Audit trail' }));

    expect(await screen.findByText('1 to 6 of 214')).toBeTruthy();
    expect(screenPath()).toBe('/history/audit');
  });

  it('says so when the Snapshots cannot be loaded', async () => {
    renderScreen('/history', { history: { failure: { status: 500, body: null } } });

    expect(await screen.findByText('Snapshots not loaded: the server answered 500.')).toBeTruthy();
  });

  it('reaches Nodes from the sidebar', async () => {
    renderScreen('/history');

    fireEvent.click(await screen.findByRole('link', { name: /^Nodes/ }));

    expect(await screen.findByRole('heading', { name: 'Nodes' })).toBeTruthy();
  });
});

describe('the Rollback confirmation', () => {
  it('moves to Nodes with the outcome once confirmed', async () => {
    renderScreen('/history/40/rollback');

    fireEvent.click(await screen.findByRole('button', { name: 'Roll back to #40' }));

    await waitFor(() => expect(screenPath()).toBe('/nodes'));
    expect(await screen.findByText('Snapshot #40 is live again.')).toBeTruthy();
  });

  it('keeps the page and says why when the server refuses', async () => {
    renderScreen('/history/40/rollback', { history: { rollback: { status: 500, body: null } } });

    fireEvent.click(await screen.findByRole('button', { name: 'Roll back to #40' }));

    expect(await screen.findByText('Not rolled back: the server answered 500.')).toBeTruthy();
    expect(screenPath()).toBe('/history/40/rollback');
  });

  it('shows the button pending while the request runs', async () => {
    renderScreen('/history/40/rollback', { history: { rollback: 'pending' } });
    const button = await screen.findByRole('button', { name: 'Roll back to #40' });

    fireEvent.click(button);

    expect(button.getAttribute('data-pending')).toBe('true');
  });

  it('says so when the target cannot be loaded, without a bar', async () => {
    const { container } = renderScreen('/history/40/rollback', { history: { failure: { status: 0, body: null } } });

    expect(await screen.findByText('Snapshot not loaded: the Console could not be reached.')).toBeTruthy();
    expect(container.querySelector('.save-bar')).toBeNull();
  });

  it('names every missing module and says when nothing changes', async () => {
    renderScreen('/history/40/rollback', { history: { plan: { missingModules: ['ldap', 'sqlauth'], objects: [], more: 0 } } });

    expect(await screen.findByText('2 modules are missing on this node')).toBeTruthy();
    expect(screen.getByText('ldap, sqlauth: this node leaves out the authsources that need them.')).toBeTruthy();
    expect(screen.getByText('Nodes serve the same configuration.')).toBeTruthy();
  });

  it('refuses a target written by a newer module', async () => {
    renderScreen('/history/40/rollback', { history: { plan: { broken: 'format' } } });

    expect(await screen.findByText('It was written by a newer version of the module than this node runs.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Roll back to #40' })).toBeNull();
  });
});
