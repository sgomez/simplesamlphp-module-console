import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { MigrationRun } from '../domain/database';
import { location, renderAt } from '../app/test/render';
import { LIST, PENDING, serveRun, update, withToken } from '../app/test/states';

const APPLIED: MigrationRun = { outcome: 'Applied', applied: [7, 8, 9], failed: null, reason: null };
const AUDIT = 'The migrations were applied but the Audit trail row failed: disk full';

describe('the message of a run, on the screen the admin lands on', () => {
  withToken();

  it('survives the redirect from the front page to the list', async () => {
    serveRun(APPLIED, null);
    renderAt('/');

    await update();

    await waitFor(() => expect(location()).toBe(LIST));
    await screen.findByRole('heading', { name: 'Service providers' });
    expect(screen.getByRole('status').textContent).toBe('Migrations applied: 7, 8, 9.');
  });

  it('stays over Not found when the run started from an unknown path', async () => {
    serveRun(APPLIED, null);
    renderAt('/x/y');

    await update();

    await screen.findByRole('heading', { name: 'Not found' });
    expect(screen.getByRole('status').textContent).toBe('Migrations applied: 7, 8, 9.');
  });

  it('goes once the admin moves on', async () => {
    serveRun(APPLIED, null);
    renderAt('/');
    await update();
    await screen.findByRole('heading', { name: 'Service providers' });

    fireEvent.click(screen.getByRole('link', { name: /SimpleSAMLphp/ }));

    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
  });

  it('reports a failed run that left the schema complete as a failure', async () => {
    serveRun({ outcome: 'Failed', applied: [7, 8, 9], failed: null, reason: AUDIT }, null);
    renderAt(LIST);

    await update();

    await screen.findByRole('heading', { name: 'Service providers' });
    const alert = screen.getByRole('alert');
    expect(alert.className).toBe('callout callout-error');
    expect(alert.querySelector('.callout-title')?.textContent).toBe('Migrations failed');
    expect(within(alert).getByText(AUDIT).className).toBe('mono wrap-any');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('keeps the reason of a failed run over the state it ended in', async () => {
    const run: MigrationRun = { outcome: 'Failed', applied: [], failed: PENDING[0] ?? null, reason: 'server has gone away' };
    serveRun(run, { state: 'Unreachable' });
    const { container } = renderAt(LIST);

    await update();

    await screen.findByRole('heading', { name: 'Database unreachable' });
    expect(within(screen.getByRole('alert')).getByText('server has gone away')).toBeDefined();
    expect(container.querySelector('.card.empty')?.className).toBe('card empty');
  });
});
