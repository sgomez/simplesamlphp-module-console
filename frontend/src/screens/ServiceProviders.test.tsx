import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { page, session, sp, stubApi } from '../test/api';
import { location, renderAt } from '../test/render';

const LIST = '/entities/saml20-sp-remote';

function serve(list: ReturnType<typeof page>) {
  return stubApi({ '/api/session': { body: session }, [`/api${LIST}`]: { body: list } });
}

describe('the service provider list', () => {
  it('lists each service provider with its name and entity ID, linking to its edit screen', async () => {
    serve(page([sp('https://hr.example.edu/sp', { name: 'HR self-service' })]));
    renderAt(LIST);

    const row = await screen.findByRole('link', { name: /HR self-service/ });

    expect(row.getAttribute('href')).toBe(`${LIST}/edit?entityid=https%3A%2F%2Fhr.example.edu%2Fsp`);
    expect(row.className).toBe('row row-wrap');
    expect(within(row).getByTitle('https://hr.example.edu/sp').textContent).toBe('https://hr.example.edu/sp');
  });

  it('opens the edit screen in the Console, without reloading the page', async () => {
    serve(page([sp('https://hr.example.edu/sp', { name: 'HR self-service' })]));
    renderAt(LIST);

    fireEvent.click(await screen.findByRole('link', { name: /HR self-service/ }));

    await waitFor(() => expect(location()).toBe(`${LIST}/edit?entityid=https%3A%2F%2Fhr.example.edu%2Fsp`));
  });

  it('heads the page with the set and the Add action', async () => {
    serve(page([]));
    renderAt(LIST);

    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe('Service providers');
    expect(screen.getByText('saml20-sp-remote').className).toBe('mono faint');
    expect(screen.getByRole('link', { name: 'Add' }).getAttribute('href')).toBe(`${LIST}/new`);
  });

  it('asks the API for the search and the page of the URL', async () => {
    const fetch = serve(page([], { query: 'lib' }));
    renderAt(`${LIST}?q=lib&page=2`);

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(`/api${LIST}?q=lib&page=2`, expect.anything()));
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('lib');
  });

  it('puts a submitted search in the URL, from the first page', async () => {
    const fetch = serve(page([sp('https://a.example.org')]));
    renderAt(`${LIST}?page=3`);

    fireEvent.change(await screen.findByRole('searchbox', { name: 'Search service providers' }), {
      target: { value: 'zoom' },
    });
    fireEvent.submit(screen.getByRole('search'));

    await waitFor(() => expect(location()).toBe(`${LIST}?q=zoom`));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(`/api${LIST}?q=zoom`, expect.anything()));
  });

  it('says that nothing matches a search and offers to clear it', async () => {
    serve(page([], { query: 'zoom' }));
    renderAt(`${LIST}?q=zoom`);

    const empty = await screen.findByRole('heading', { name: 'No service provider matches “zoom”' });

    expect(empty.parentElement?.className).toBe('card empty');
    expect(screen.getByRole('link', { name: 'Clear search' }).getAttribute('href')).toBe(LIST);
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).toBeNull();
  });

  it('renders nothing for the list when the API refuses it', async () => {
    const fetch = stubApi({ '/api/session': { body: session }, [`/api${LIST}`]: { status: 503, body: {} } });
    const { container } = renderAt(LIST);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));

    expect(container.querySelector('.card-list, .empty')).toBeNull();
  });

  it('renders no list and no skeleton while the page loads', async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL) =>
      String(input) === '/api/session'
        ? new Response(JSON.stringify(session))
        : new Promise<Response>(() => undefined),
    );
    vi.stubGlobal('fetch', fetch);
    const { container } = renderAt(LIST);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));

    expect(container.querySelector('main')?.querySelector('.card, .skel, [aria-busy]')).toBeNull();
  });
});
