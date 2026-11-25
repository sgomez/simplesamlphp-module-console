import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EDIT, ENTITY, PHP, entity, session, stubApi } from '../app/test/api';
import { editor, openEdit } from '../app/test/edit';
import { renderAt } from '../app/test/render';

describe('the edit screen, opened', () => {
  it('asks the API for the entity of the URL', async () => {
    const fetch = await openEdit();

    expect(fetch).toHaveBeenCalledWith(`${ENTITY}?entityid=https%3A%2F%2Fsp.example.org`, expect.anything());
  });

  it('marks the errors a stored object has against the current schema, when it is opened', async () => {
    await openEdit(
      entity({ errors: [{ pointer: '/AssertionConsumerService', message: 'Missing.', line: 2, column: null }] }),
    );

    expect([...document.querySelectorAll('.ed-ln.err')].map((line) => line.textContent)).toEqual(['×2']);
    expect(within(screen.getByRole('main')).getByText('Missing.')).not.toBeNull();
  });

  it('heads the page with the name, the kind, the set and the entity ID with Copy', async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    await openEdit();

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Example');
    expect(screen.getByText('Service provider').className).toBe('small muted');
    expect(screen.getByText('saml20-sp-remote').className).toBe('mono faint');
    const id = within(screen.getByRole('main')).getByText('https://sp.example.org');
    expect(id.className).toBe('mono muted wrap-any');
    fireEvent.click(within(id.parentElement as HTMLElement).getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith('https://sp.example.org');
  });

  it('puts the name in the breadcrumb, under a link to the list', async () => {
    await openEdit();
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });

    expect(within(crumbs).getByRole('link', { name: 'Service providers' }).getAttribute('href')).toBe(
      '/entities/saml20-sp-remote',
    );
    await waitFor(() => expect(within(crumbs).getByText('Example').getAttribute('aria-current')).toBe('page'));
  });

  it('titles an entity without a name with its entity ID, wrapping anywhere', async () => {
    await openEdit(entity({ name: null }));

    const title = screen.getByRole('heading', { level: 1 });
    expect(title.textContent).toBe('https://sp.example.org');
    expect(title.className).toBe('h1 wrap-any');
  });

  it('shows the PHP text in the editor with its line numbers, on a wide page', async () => {
    await openEdit();

    expect(editor().value).toBe(PHP);
    expect([...document.querySelectorAll('.ed-ln')].map((line) => line.textContent)).toEqual(['1', '2', '3']);
    expect(document.querySelector('main')?.className).toBe('page page-wide');
    expect(screen.getByText('Literal values only. Comments are not kept.').className).toBe('small muted code-label');
  });

  it('shows the warnings of the entity as warnings, with no error', async () => {
    await openEdit(entity({ warnings: [{ label: 'Signing off', message: "'sign.logout' is false." }] }));

    const mark = screen.getByText("'sign.logout' is false.").parentElement as HTMLElement;

    expect(mark.className).toBe('msg-warning');
    expect(within(mark).getByText('Warning').className).toBe('mark-label');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('says Not found, naming the entity ID, for an entity that does not exist', async () => {
    stubApi({ '/api/session': { body: session }, [ENTITY]: { status: 404, body: { error: 'not found' } } });
    renderAt(EDIT);

    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe('Not found');
    expect(screen.getByText('https://sp.example.org').className).toBe('mono wrap-any');
    expect(screen.queryByRole('textbox', { name: 'PHP' })).toBeNull();
  });

  it('shows the load error of an entity that cannot be read, with no editor and no save bar', async () => {
    stubApi({
      '/api/session': { body: session },
      [ENTITY]: { body: entity({ name: null, unreadable: true, php: null, error: 'The document is not valid JSON.' }) },
    });
    renderAt(EDIT);

    const callout = await screen.findByRole('alert');

    expect(callout.className).toBe('callout callout-error');
    expect(within(callout).getByText('Unreadable').className).toBe('callout-title');
    expect(within(callout).getByText('The document is not valid JSON.')).toBeDefined();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('https://sp.example.org');
    expect(screen.queryByRole('textbox', { name: 'PHP' })).toBeNull();
    expect(document.querySelector('.save-bar')).toBeNull();
  });
});
