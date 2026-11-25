import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { refusal } from '../app/test/api';
import { renderAt } from '../app/test/render';
import { LIST, PENDING, serveRun, update, withToken } from '../app/test/states';

describe('a run the server does not carry out', () => {
  withToken();

  it('shows Request refused for a 403', async () => {
    serveRun({ status: 403, body: { error: 'refused' } }, { missing: PENDING });
    renderAt(LIST);

    await update();

    expect(await screen.findByRole('heading', { name: 'Request refused' })).toBeDefined();
  });

  it('shows the state page the 503 names', async () => {
    serveRun(refusal({ state: 'ConsoleOlder', highest: 10 }), { missing: PENDING });
    renderAt(LIST);

    await update();

    expect(await screen.findByRole('heading', { name: 'Console older than the database' })).toBeDefined();
  });

  it('says so in an error callout for any other answer', async () => {
    serveRun({ status: 500, body: null }, { missing: PENDING });
    const { container } = renderAt(LIST);

    await update();

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('Migrations not run: the server answered 500.');
    expect(container.querySelector('.state-card')).toBeNull();
    expect((await screen.findByRole('button', { name: 'Update database' })).className).toBe('btn btn-primary');
  });

  it('says so when no answer comes', async () => {
    const stub = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith('/api/migrate')) {
        throw new TypeError('offline');
      }

      return new Response(JSON.stringify(refusal({ missing: PENDING }).body), { status: 503 });
    });
    vi.stubGlobal('fetch', stub);
    renderAt(LIST);

    await update();

    expect((await screen.findByRole('alert')).textContent).toBe('Migrations not run: the Console could not be reached.');
  });
});
