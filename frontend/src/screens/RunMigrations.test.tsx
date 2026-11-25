import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderAt } from '../test/render';
import { LIST, PENDING, serveRun, update, withToken } from '../test/states';

describe('the outcome of Run migrations', () => {
  withToken();

  it('goes on to the requested screen with the applied migrations as a one-shot message', async () => {
    serveRun({ outcome: 'Applied', applied: [7, 8, 9], failed: null, reason: null }, null);
    renderAt(LIST);

    await update();

    await screen.findByRole('heading', { name: 'Service providers' });
    const message = screen.getByRole('status');
    expect(message.className).toBe('callout callout-success');
    expect(message.textContent).toBe('Migrations applied: 7, 8, 9.');

    fireEvent.click(screen.getByRole('link', { name: /SimpleSAMLphp/ }));
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
  });

  it('says so when the schema was already up to date', async () => {
    serveRun({ outcome: 'Applied', applied: [], failed: null, reason: null }, null);
    renderAt(LIST);

    await update();

    const message = await screen.findByRole('status');
    expect(message.className).toBe('callout callout-info');
    expect(message.textContent).toBe('The database schema is already up to date.');
  });

  it('reports a run that lost the race over the state as it now stands', async () => {
    const reason = 'Another run is applying the migrations at the same time.';
    serveRun({ outcome: 'Concurrent', applied: [], failed: null, reason }, { missing: PENDING.slice(2) });
    renderAt(LIST);

    await update();

    expect(await screen.findByRole('heading', { level: 2, name: '1 migration to apply' })).toBeDefined();
    const message = screen.getByRole('status');
    expect(message.className).toBe('callout callout-warning');
    expect(message.textContent).toBe(reason);
  });

  it('stops at a failed migration and says which one and why', async () => {
    const reason = "SQLSTATE[42S01]: Base table or view already exists: 1050 Table 'console_audit' already exists";
    serveRun({ outcome: 'Failed', applied: [], failed: PENDING[0] ?? null, reason }, { missing: PENDING });
    const { container } = renderAt(LIST);

    await update();

    const alert = await screen.findByRole('alert');
    expect(alert.className).toBe('callout callout-error');
    expect(alert.querySelector('.callout-title')?.textContent).toBe('Migration 7 failed: Create console_audit');
    expect(within(alert).getByText(reason).className).toBe('mono wrap-any');
    expect(container.querySelector('.state-card')).toBeNull();
    const failed = container.querySelectorAll('.card-list .status');
    expect(failed).toHaveLength(1);
    expect(failed[0]?.className).toBe('status s-danger');
    expect(failed[0]?.textContent).toBe('Failed');
    expect(failed[0]?.querySelector('path')?.getAttribute('d')).toMatch(/^M8 1a7 7 0 1 0 0 14A7/);
    expect(failed[0]?.closest('.row')?.textContent).toBe('7Create console_auditFailed');
  });

  it('reports a failure outside any migration with its reason', async () => {
    serveRun({ outcome: 'Failed', applied: [7], failed: null, reason: 'disk full' }, { missing: PENDING.slice(1) });
    renderAt(LIST);

    await update();

    const alert = await screen.findByRole('alert');
    expect(alert.querySelector('.callout-title')?.textContent).toBe('Migrations failed');
    expect(within(alert).getByText('disk full')).toBeDefined();
  });
});
