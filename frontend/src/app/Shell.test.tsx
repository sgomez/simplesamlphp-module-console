import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { page, session, stubApi } from '../test/api';
import { location, renderAt } from '../test/render';
import { Shell } from './Shell';

const LIST = '/entities/saml20-sp-remote';

function serve(pendingCount = 0) {
  return stubApi({ '/api/session': { body: { ...session, pendingCount } }, [`/api${LIST}`]: { body: page([]) } });
}

describe('the shell', () => {
  it('sends the front page to the service provider list', async () => {
    serve();
    renderAt('/');

    await waitFor(() => expect(location()).toBe(LIST));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Service providers');
  });

  it('holds the Milestone 1 entries only, the current one marked', async () => {
    serve();
    renderAt(LIST);
    const nav = screen.getByRole('navigation', { name: 'Main' });

    const entries = within(nav).getAllByRole('link').filter((link) => link.className.startsWith('nav-item'));

    expect(entries.map((link) => link.textContent)).toEqual(['Service providers', 'Publish']);
    expect(entries[0]?.className).toBe('nav-item active');
    expect(entries[0]?.getAttribute('aria-current')).toBe('page');
    expect(entries[1]?.getAttribute('href')).toBe('/publish');
    expect(within(nav).getAllByRole('heading').map((h) => h.textContent)).toEqual(['Entities', 'Changes']);
  });

  it('shows the site above the entries', () => {
    serve();
    renderAt(LIST);

    const brand = screen.getByRole('link', { name: /SimpleSAMLphp/ });

    expect(brand.querySelector('.brand-host')?.textContent).toBe(window.location.hostname);
  });

  it('shows the identity, the core admin link and logout at the foot of the sidebar', async () => {
    serve();
    renderAt(LIST);

    expect((await screen.findByText('admin')).className).toBe('identity-name');
    expect(screen.getByRole('link', { name: 'Administration' }).getAttribute('href')).toBe(session.adminUrl);
    expect(screen.getByRole('link', { name: 'Log out' }).getAttribute('href')).toBe(session.logoutUrl);
  });

  it('carries the Pending changes count on Publish and in the header', async () => {
    serve(3);
    renderAt(LIST);

    const review = await screen.findByRole('link', { name: 'Review 3 changes' });

    expect(review.getAttribute('href')).toBe('/publish');
    expect(review.className).toBe('btn btn-global btn-sm');
    expect(screen.getByLabelText('3 changes to publish').textContent).toBe('3');
  });

  it('says change for a single Pending change', async () => {
    serve(1);
    renderAt(LIST);

    expect(await screen.findByRole('link', { name: 'Review 1 change' })).toBeDefined();
  });

  it('shows no count without Pending changes', async () => {
    const fetch = serve(0);
    renderAt(LIST);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));

    expect(screen.queryByRole('link', { name: /Review/ })).toBeNull();
    expect(document.querySelector('.nav-badge')).toBeNull();
  });

  it('has a breadcrumb from the Console to the current screen', () => {
    serve();
    renderAt(LIST);
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });

    expect(within(crumbs).getByRole('link', { name: 'Console' }).getAttribute('href')).toBe('/');
    expect(within(crumbs).getByText('Service providers').getAttribute('aria-current')).toBe('page');
  });

  it('opens the sidebar as an overlay from the menu button and closes it on navigation', async () => {
    serve();
    renderAt(LIST);
    const menu = screen.getByRole('button', { name: 'Menu' });
    const side = document.getElementById('nav') as HTMLElement;

    fireEvent.click(menu);
    expect(side.className).toBe('shell-side is-open');
    expect(menu.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(within(side).getByRole('link', { name: /SimpleSAMLphp/ }));
    await waitFor(() => expect(side.className).toBe('shell-side'));
  });

  it('links the parent of the current crumb', () => {
    render(
      <MemoryRouter>
        <Shell session={session} crumb="Not found" parent={{ label: 'Service providers', to: LIST }}>
          {null}
        </Shell>
      </MemoryRouter>,
    );
    const trail = screen.getByRole('navigation', { name: 'Breadcrumb' });

    expect([...trail.querySelectorAll('.crumb, .crumb-current')].map((crumb) => crumb.textContent)).toEqual([
      'Console',
      'Service providers',
      'Not found',
    ]);
    expect(within(trail).getByRole('link', { name: 'Service providers' }).getAttribute('href')).toBe(LIST);
  });
});
