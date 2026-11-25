import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ENTITY, VALIDATE, posted } from '../app/test/api';
import { STARTER, TYPED, openNew } from '../app/test/add';
import { editor, saveBar } from '../app/test/edit';
import { location } from '../app/test/render';

describe('adding a service provider, opened', () => {
  it('opens the editor with the starter text the API gives', async () => {
    const fetch = await openNew();

    expect(fetch).toHaveBeenCalledWith(ENTITY, expect.anything());
    expect(editor().value).toBe(STARTER);
  });

  it('heads the page Add service provider, with no entity ID beside it', async () => {
    await openNew();
    const main = screen.getByRole('main');

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Add service provider');
    expect(within(main).getByText('Service provider').className).toBe('small muted');
    expect(within(main).getByText('saml20-sp-remote').className).toBe('mono faint');
    expect(main.querySelector('.obj-id')).toBeNull();
  });

  it('puts Add in the breadcrumb, under a link to the list', async () => {
    await openNew();
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });

    expect(within(crumbs).getByRole('link', { name: 'Service providers' }).getAttribute('href')).toBe(
      '/entities/saml20-sp-remote',
    );
    expect(within(crumbs).getByText('Add').getAttribute('aria-current')).toBe('page');
  });

  it('says Unsaved, and offers Cancel and Save before any edit', async () => {
    await openNew();
    const bar = saveBar();

    expect(within(bar).getByText('Unsaved').parentElement?.className).toBe('status s-unsaved');
    expect(within(bar).getByRole('button', { name: 'Cancel' }).className).toBe('btn btn-quiet');
    expect(within(bar).getByRole('button', { name: 'Save' }).hasAttribute('disabled')).toBe(false);
    expect(within(bar).queryByRole('button', { name: 'Discard edits' })).toBeNull();
  });

  it('goes back to the list on Cancel', async () => {
    await openNew({ '/api/entities/saml20-sp-remote': { body: { rows: [], total: 0, page: 1, pages: 0, perPage: 25, query: '' } } });

    fireEvent.click(within(saveBar()).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(location()).toBe('/entities/saml20-sp-remote'));
  });

  it('validates the text as a new entity, whose entity ID comes from the text', async () => {
    const fetch = await openNew();

    fireEvent.change(editor(), { target: { value: TYPED } });

    await waitFor(() => expect(posted(fetch, VALIDATE)).toEqual({ entityid: '', php: TYPED }));
  });

});
