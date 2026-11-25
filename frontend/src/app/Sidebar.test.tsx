import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { page, refusal, session, stubApi } from './test/api';
import { renderAt } from './test/render';

const LIST = '/entities/saml20-sp-remote';

function entries() {
  return within(screen.getByRole('navigation', { name: 'Main' }))
    .getAllByRole('link')
    .filter((link) => link.className.startsWith('nav-item'));
}

describe('the sidebar', () => {
  it('lists the screens the server serves, then core’s pages, the current one marked', async () => {
    stubApi({ '/api/session': { body: session }, [`/api${LIST}`]: { body: page([]) } });
    renderAt(LIST);
    await screen.findByText('Configuration');
    const nav = screen.getByRole('navigation', { name: 'Main' });

    expect(entries().map((link) => link.firstChild?.textContent)).toEqual([
      'Service providers',
      'Publish',
      'Configuration',
      'Test authentication',
      'Federation',
    ]);
    expect(within(nav).getAllByRole('heading').map((h) => h.textContent)).toEqual(['Entities', 'Changes', 'System']);
    expect(entries()[0]?.className).toBe('nav-item active');
    expect(entries()[0]?.getAttribute('aria-current')).toBe('page');
    expect(entries().map((link) => link.getAttribute('href'))).toEqual([
      LIST,
      '/publish',
      session.core.configuration,
      session.core.test,
      session.core.federation,
    ]);
  });

  it('counts the service providers', async () => {
    stubApi({
      '/api/session': { body: { ...session, counts: { 'saml20-sp-remote': 1234 } } },
      [`/api${LIST}`]: { body: page([]) },
    });
    renderAt(LIST);

    const count = await screen.findByText('1,234');

    expect(count.className).toBe('nav-count');
    expect(count.parentElement).toBe(entries()[0]);
  });

  it('shows the identity and logout at its foot, and no link to core’s front page there', async () => {
    stubApi({ '/api/session': { body: session }, [`/api${LIST}`]: { body: page([]) } });
    renderAt(LIST);

    expect((await screen.findByText('admin')).className).toBe('identity-name');
    expect(screen.getByRole('link', { name: 'Log out' }).getAttribute('href')).toBe(session.logoutUrl);
    expect(screen.queryByRole('link', { name: 'Administration' })).toBeNull();
  });

  it('keeps core’s pages and the identity on a state page, without counts', async () => {
    stubApi({ '/api/session': refusal() });
    renderAt(LIST);

    await screen.findByText('admin');

    expect(entries().map((link) => link.firstChild?.textContent)).toEqual([
      'Service providers',
      'Publish',
      'Configuration',
      'Test authentication',
      'Federation',
    ]);
    expect(document.querySelector('.nav-count')).toBeNull();
  });

  it('holds the screens alone while the session loads', async () => {
    const fetch = stubApi({ '/api/session': { body: session }, [`/api${LIST}`]: { body: page([]) } });
    renderAt(LIST);

    expect(entries().map((link) => link.textContent)).toEqual(['Service providers', 'Publish']);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });
});
