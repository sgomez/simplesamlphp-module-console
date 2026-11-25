import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { withDialogs } from '../app/test/delete';
import { PublishFrame, type PublishFrameProps } from '../app/test/PublishFrame';

function renderPublish(props: Omit<PublishFrameProps, 'publication'> & Partial<PublishFrameProps> = {}) {
  render(
    <MemoryRouter initialEntries={['/publish']}>
      <PublishFrame publication={{}} pending={7} {...props} />
    </MemoryRouter>,
  );
}

describe('discarding on Publish, where the API serves it', () => {
  withDialogs();

  it('unfolds a change to its diff, Open and Discard this change, which drops it from the list', async () => {
    renderPublish();

    fireEvent.click(await screen.findByRole('button', { name: /Moodle/ }));
    const row = screen.getByRole('button', { name: /Moodle/ }).closest('.grp') as HTMLElement;

    expect(row.querySelector('.diff')?.textContent).toContain('eduPersonAffiliation');
    expect(within(row).getByRole('link', { name: 'Open' }).getAttribute('href')).toBe(
      '/entities/saml20-sp-remote/edit?entityid=https%3A%2F%2Fmoodle.example.edu%2Fshibboleth',
    );
    fireEvent.click(within(row).getByRole('button', { name: 'Discard this change' }));

    expect(await screen.findByRole('heading', { name: '6 changes' })).toBeDefined();
    expect(screen.queryByRole('button', { name: /Moodle/ })).toBeNull();
  });

  it('offers no Open on a Deleted change', async () => {
    renderPublish();

    fireEvent.click(await screen.findByRole('button', { name: /legacy-radius/ }));
    const row = screen.getByRole('button', { name: /legacy-radius/ }).closest('.grp') as HTMLElement;

    expect(within(row).queryByRole('link', { name: 'Open' })).toBeNull();
    expect(within(row).getByRole('button', { name: 'Discard this change' })).toBeDefined();
  });

  it('discards every change after asking, and then has nothing to publish', async () => {
    renderPublish();

    fireEvent.click(await screen.findByRole('button', { name: 'Discard all 7 changes…' }));
    fireEvent.click(screen.getByRole('button', { name: 'Discard 7 changes' }));

    expect(await screen.findByRole('heading', { name: 'Nothing to publish' })).toBeDefined();
  });

  it('says why nothing was discarded, keeping the review', async () => {
    renderPublish({ more: { discardAll: async () => ({ ok: false, status: 500, body: null }) } });

    fireEvent.click(await screen.findByRole('button', { name: 'Discard all 7 changes…' }));
    fireEvent.click(screen.getByRole('button', { name: 'Discard 7 changes' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Not discarded: the server answered 500.');
    await waitFor(() => expect(screen.getByRole('heading', { name: '7 changes' })).toBeDefined());
  });
});
