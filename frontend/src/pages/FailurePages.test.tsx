import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { EDIT, ENTITY, page, session, sp, stubApi } from '../app/test/api';
import { location, renderAt } from '../app/test/render';
import { NotFoundPage } from './NotFoundPage';

const LIST = '/entities/saml20-sp-remote';

function serveList(status: number) {
  return stubApi({ '/api/session': { body: session }, [`/api${LIST}`]: { status, body: { error: 'x' } } });
}

function crumbs(): string[] {
  const trail = screen.getByRole('navigation', { name: 'Breadcrumb' });

  return [...trail.querySelectorAll('.crumb, .crumb-current')].map((crumb) => crumb.textContent ?? '');
}

describe('a failed request', () => {
  it('shows Not found for a path the router does not know, with a way back to the Console', async () => {
    stubApi({ '/api/session': { body: session }, [`/api${LIST}`]: { body: page([sp('https://a.example.org')]) } });
    renderAt('/x/y');

    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe('Not found');
    expect(crumbs()).toEqual(['Console', 'Not found']);
    expect(screen.getByRole('main').className).toBe('page page-narrow');
    expect(screen.getByRole('heading', { level: 1 }).parentElement?.className).toBe('card empty state-card');

    fireEvent.click(within(screen.getByRole('main')).getByRole('link', { name: 'Back to the Console' }));

    await waitFor(() => expect(location()).toBe(LIST));
    expect(await screen.findByTitle('https://a.example.org')).toBeTruthy();
  });

  it.each([`${LIST}/edit`, `${LIST}/edit?entityid=`])('shows the path Not found for %s, which names no entity', async (path) => {
    const fetch = stubApi({ '/api/session': { body: session } });
    renderAt(path);

    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe('Not found');
    expect(crumbs()).toEqual(['Console', 'Not found']);
    expect(screen.queryByText(/No service provider/)).toBeNull();
    expect(screen.getByRole('link', { name: 'Back to the Console' })).toBeDefined();
    expect(fetch.mock.calls.map(([input]) => String(input))).toEqual(['/api/session']);
  });

  it('shows Not found when the API has no answer for the screen', async () => {
    serveList(404);
    renderAt(LIST);

    expect((await screen.findByRole('heading', { level: 1, name: 'Not found' })).textContent).toBe('Not found');
    expect(crumbs()).toEqual(['Console', 'Not found']);
    expect(screen.getByRole('link', { name: 'Back to the Console' }).getAttribute('href')).toBe('/');
    expect(screen.queryByRole('search')).toBeNull();
  });

  it('shows Request refused on a 403 and keeps nothing of the screen', async () => {
    serveList(403);
    renderAt(`${LIST}?q=wiki`);

    await screen.findByText('Nothing was saved.');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Request refused');
    expect(crumbs()).toEqual(['Console', 'Request refused']);
    expect(screen.queryByRole('search')).toBeNull();
    expect(screen.getByRole('link', { name: 'Back to the Console' }).getAttribute('href')).toBe('/');
  });

  it('shows nothing of its own on any other status', async () => {
    const fetch = serveList(500);
    renderAt(LIST);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Service providers');
    expect(screen.getByRole('main').className).toBe('page');
  });

  it('names the missing entity ID and links to its list when the object is not found', () => {
    render(
      <MemoryRouter>
        <NotFoundPage entityId="https://wiki.example.edu/shibboleth" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Not found');
    expect(screen.getByText(/No service provider has the entity ID/).textContent).toBe(
      'No service provider has the entity ID https://wiki.example.edu/shibboleth',
    );
    expect(screen.getByText('https://wiki.example.edu/shibboleth').className).toBe('mono wrap-any');
    expect(screen.getByRole('link', { name: 'Service providers' }).getAttribute('href')).toBe(LIST);
  });

  it('keeps the list of a missing object in the breadcrumb', async () => {
    stubApi({ '/api/session': { body: session }, [ENTITY]: { status: 404, body: { error: 'not found' } } });
    renderAt(EDIT);

    await screen.findByRole('heading', { level: 1, name: 'Not found' });
    expect(crumbs()).toEqual(['Console', 'Service providers', 'Not found']);
    expect(screen.getByRole('main').className).toBe('page page-narrow');
  });
});
