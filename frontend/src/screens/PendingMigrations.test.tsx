import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MigrationRun } from '../api/types';
import { refusal, stubApi } from '../test/api';
import { renderAt } from '../test/render';
import { crumb, expectStateShell, LIST, PENDING, serveRun, serveState, update, withToken } from '../test/states';

describe('the pending migrations page', () => {
  it('warns, lists the migrations and offers the update', async () => {
    serveState({ missing: PENDING });
    const { container } = renderAt(LIST);

    await screen.findByRole('heading', { name: 'The database needs an update' });
    expect(crumb().textContent).toBe('Database update');
    const warning = 'A migration cannot be undone without restoring a backup. Sign-in is not affected.';
    expect(screen.getByText(warning).className).toBe('muted empty-text');
    expect(screen.getByRole('button', { name: 'Update database' }).className).toBe('btn btn-primary');
    expect(within(screen.getByRole('main')).getByRole('heading', { level: 2 }).textContent).toBe('3 migrations to apply');
    expect([...container.querySelectorAll('.card-list .row')].map((row) => row.textContent)).toEqual([
      '7Create console_audit',
      '8Create the index console_audit_entity',
      '9Create the index console_audit_authsource',
    ]);
    expect(container.querySelector('.state-card')).not.toBeNull();
    expect(container.querySelector('.status')).toBeNull();
    expectStateShell(container);
  });

  it('says migration for a single one', async () => {
    serveState({ missing: PENDING.slice(2) });
    renderAt(LIST);

    expect(await screen.findByRole('heading', { level: 2, name: '1 migration to apply' })).toBeDefined();
  });
});

describe('the update button', () => {
  withToken();

  it('posts with the request-forgery token and a JSON body', async () => {
    const fetch = serveRun({ outcome: 'Applied', applied: [7, 8, 9], failed: null, reason: null }, null);
    renderAt(LIST);

    await update();

    const migrate = () => fetch.mock.calls.find(([url]) => String(url).endsWith('/api/migrate'));
    await waitFor(() => expect(migrate()).toBeDefined());
    const init = migrate()?.[1];
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('{}');
    expect(new Headers(init?.headers).get('X-Console-Token')).toBe('the-token');
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json');
  });

  it('works while the run is under way', async () => {
    let finish: (run: MigrationRun) => void = () => undefined;
    const pending = new Promise<MigrationRun>((resolve) => {
      finish = resolve;
    });
    const stub = stubApi({ '/api/session': refusal({ missing: PENDING }) });
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) =>
      String(input).endsWith('/api/migrate') ? new Response(JSON.stringify(await pending)) : stub(input, init),
    );
    renderAt(LIST);

    await update();

    const button = screen.getByRole('button', { name: 'Update database' }) as HTMLButtonElement;
    expect(button.className).toBe('btn btn-primary is-loading');
    expect(button.disabled).toBe(true);
    finish({ outcome: 'Concurrent', applied: [], failed: null, reason: 'Another run.' });
    expect(await screen.findByText('Another run.')).toBeDefined();
  });
});
