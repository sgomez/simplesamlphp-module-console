import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderScreen, screenPath } from '../app/test/screens';

describe('the Audit trail', () => {
  it('pages through the rows, keeping the filters', async () => {
    renderScreen('/history/audit?action=edit');
    await screen.findByText('1 to 6 of 211');

    fireEvent.click(screen.getByRole('link', { name: 'Next' }));

    expect(await screen.findByText('7 to 12 of 211')).toBeTruthy();
    expect(screenPath()).toBe('/history/audit?action=edit&page=2');
  });

  it('filters by object from the first page', async () => {
    renderScreen('/history/audit?page=3');
    const search = await screen.findByRole('searchbox', { name: 'Object' });

    fireEvent.change(search, { target: { value: 'moodle' } });
    fireEvent.submit(search.closest('form') as HTMLFormElement);

    expect(await screen.findByText('1 to 1 of 1')).toBeTruthy();
    expect(screenPath()).toBe('/history/audit?object=moodle');
  });

  it('filters by action and by date, and clears a filter set back to any', async () => {
    renderScreen('/history/audit');
    const action = await screen.findByRole('combobox', { name: 'Action' });

    fireEvent.change(action, { target: { value: 'Deleted' } });
    expect(await screen.findByText('legacy-radius')).toBeTruthy();
    expect(screenPath()).toBe('/history/audit?action=delete');

    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-11-23' } });
    expect(await screen.findByRole('heading', { name: 'No change matches the filters' })).toBeTruthy();

    fireEvent.change(screen.getByRole('combobox', { name: 'Action' }), { target: { value: 'Any action' } });
    fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2026-11-23' } });
    expect(await screen.findByText('1 to 2 of 2')).toBeTruthy();
    expect(screenPath()).toBe('/history/audit?from=2026-11-23&to=2026-11-23');
  });

  it('shows a document that can no longer be translated as raw JSON', async () => {
    renderScreen('/history/audit', {
      audit: {
        entries: [
          {
            id: 1,
            at: '2026-01-02T03:04:00',
            identity: 'admin',
            action: 'create',
            subject: { type: 'object', name: 'Old', kind: 'Service provider' },
            diff: null,
            document: '{"entityid":"https://old.example.org"}',
            raw: true,
          },
        ],
      },
    });

    fireEvent.click(await screen.findByRole('button', { name: /Created/ }));

    expect(within(screen.getByLabelText('JSON', { selector: 'pre' })).getByText(/old\.example\.org/)).toBeTruthy();
  });

  it('says so when the rows cannot be loaded', async () => {
    renderScreen('/history/audit', { audit: { failure: { status: 500, body: null } } });

    expect(await screen.findByText('Audit trail not loaded: the server answered 500.')).toBeTruthy();
  });
});
