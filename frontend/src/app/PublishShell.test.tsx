import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Session } from '../domain/session';
import { page, review, session, stubApi } from './test/api';
import { PUBLISH, ready } from './test/publication';
import { renderAt } from './test/render';

function servePublish(more: Partial<Session>) {
  return stubApi({ '/api/session': { body: { ...session, ...more } }, '/api/publication': { body: review() } });
}

describe('the shell on the Publish screen', () => {
  it('marks Publish in the sidebar and the breadcrumb, on a normal page when there is nothing to publish', async () => {
    servePublish({ pendingCount: 2 });
    renderAt(PUBLISH);
    const nav = screen.getByRole('navigation', { name: 'Main' });

    expect(within(nav).getByRole('link', { name: /Publish/ }).className).toBe('nav-item active');
    expect(within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByText('Publish')).toBeDefined();
    await screen.findByRole('heading', { name: 'Nothing to publish' });
    expect(document.querySelector('main')?.className).toBe('page');
  });

  it('puts the changes on the Publish page, and leaves the next screen at its own width', async () => {
    stubApi({
      '/api/session': { body: session },
      '/api/publication': { body: ready },
      '/api/entities/saml20-sp-remote': { body: page([]) },
    });
    renderAt(PUBLISH);

    await screen.findByRole('complementary', { name: 'This Publication' });
    expect(document.querySelector('main')?.className).toBe('page page-publish');

    fireEvent.click(screen.getByRole('link', { name: 'Service providers' }));
    await screen.findByRole('heading', { name: 'Service providers', level: 1 });
    expect(document.querySelector('main')?.className).toBe('page');
  });

  it('shows the current Snapshot and when it was published in the header instead of the Review button', async () => {
    servePublish({ pendingCount: 2, current: { number: 41, createdAt: '2026-11-20T10:15:00Z' } });
    renderAt(PUBLISH);

    const live = await screen.findByText('Live: Snapshot #41');
    const status = live.closest('.status') as HTMLElement;

    expect(status.className).toBe('status s-live');
    expect(status.querySelector('.faint')?.textContent).toMatch(/^ · 20 Nov 2026, \d\d:\d5$/);
    expect(status.querySelector('.faint')?.className).toBe('faint status-when');
    expect(screen.queryByRole('link', { name: /Review/ })).toBeNull();
  });

  it('shows no time for a Snapshot without one', async () => {
    servePublish({ current: { number: 41, createdAt: null } });
    renderAt(PUBLISH);

    const live = await screen.findByText('Live: Snapshot #41');

    expect(live.closest('.status')?.querySelector('.faint')).toBeNull();
  });

  it('shows neither the Review button nor a Snapshot before the first Publication', async () => {
    const fetch = servePublish({ pendingCount: 2 });
    renderAt(PUBLISH);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    await screen.findByLabelText('2 changes to publish');

    expect(document.querySelector('.shell-head .status')).toBeNull();
    expect(screen.queryByRole('link', { name: /Review/ })).toBeNull();
  });
});
