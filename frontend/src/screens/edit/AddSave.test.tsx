import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { EditedEntity } from '../../api/types';
import { ENTITY, SAVE, posted, saveRefusal, session } from '../../test/api';
import { CREATED, NEW, TYPED, created, saveNew } from '../../test/add';
import { editor, saveBar } from '../../test/edit';
import { location } from '../../test/render';

describe('adding a service provider, saved', () => {
  it('creates with the text alone, no entity ID and no version', async () => {
    const fetch = await saveNew({ body: created });

    expect(posted(fetch, SAVE)).toEqual({ php: TYPED });
  });

  it('moves to the edit screen of the new entity, saying Saved with the notices of the save', async () => {
    const fetch = await saveNew({ body: created }, { '/api/session': { body: { ...session, pendingCount: 1 } } });

    await waitFor(() => expect(location()).toBe(CREATED));
    const callout = (await screen.findByText('Saved. Not live yet.')).closest('.callout') as HTMLElement;

    expect(within(callout).getByRole('link', { name: 'Review 1 change' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('https://new.example.org');
    expect(editor().value).toBe(TYPED);
    expect(screen.getByText("Did you mean 'SingleLogoutService'?").parentElement?.className).toBe('msg-warning');
    expect(within(saveBar()).getByText('Unpublished')).toBeDefined();
    expect(fetch.mock.calls.some(([input]) => String(input).startsWith(`${ENTITY}?`))).toBe(false);
  });

  it('asks for the session once after the create', async () => {
    const fetch = await saveNew({ body: created });
    await screen.findByText('Saved. Not live yet.');

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(fetch.mock.calls.filter(([input]) => String(input) === '/api/session')).toHaveLength(2);
  });

  it('says Saved only once: the edit screen opened again shows no message', async () => {
    const list = { rows: [{ entityId: 'https://new.example.org', name: null, state: 'Unpublished', labels: [], unreadable: false, error: null }], total: 1, page: 1, pages: 1, perPage: 25, query: '' };
    await saveNew(
      { body: created },
      {
        '/api/entities/saml20-sp-remote': { body: list },
        [`${ENTITY}?entityid=https%3A%2F%2Fnew.example.org`]: { body: { ...created, notices: [] } as EditedEntity },
      },
    );
    await screen.findByText('Saved. Not live yet.');

    fireEvent.click(within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByRole('link', { name: 'Service providers' }));
    fireEvent.click(await screen.findByRole('link', { name: /new\.example\.org/ }));

    await waitFor(() => expect(location()).toBe(CREATED));
    await screen.findByRole('textbox', { name: 'PHP' });
    expect(screen.queryByText('Saved. Not live yet.')).toBeNull();
  });

  it('keeps the text and puts "already exists" on its line, with a link to the existing entity', async () => {
    await saveNew({
      status: 422,
      body: saveRefusal({
        errors: [
          {
            pointer: '',
            message: 'A service provider with this entity ID already exists.',
            line: 1,
            column: null,
            existing: { entityId: 'https://new.example.org', name: 'Moodle' },
          },
        ],
      }),
    });

    const message = await screen.findByText('A service provider with this entity ID already exists.');
    const mark = message.closest('li') as HTMLElement;
    const open = within(mark).getByRole('link', { name: 'Open Moodle' });

    expect(within(screen.getByRole('alert')).getByText('Not saved: 1 error')).toBeDefined();
    expect(within(mark).getByRole('link', { name: 'Line 1' })).toBeDefined();
    expect(message.parentElement?.className).toBe('msg-error');
    expect(open.className).toBe('link');
    expect(open.getAttribute('href')).toBe(CREATED);
    expect(editor().value).toBe(TYPED);
    expect(location()).toBe(NEW);
    expect([...document.querySelectorAll('.ed-ln.err')].map((line) => line.textContent)).toEqual(['×1']);
  });

  it('names the existing entity by its entity ID when it has no name', async () => {
    await saveNew({
      status: 422,
      body: saveRefusal({
        errors: [
          {
            pointer: '',
            message: 'A service provider with this entity ID already exists.',
            line: 1,
            column: null,
            existing: { entityId: 'https://new.example.org', name: null },
          },
        ],
      }),
    });

    expect(await screen.findByRole('link', { name: 'Open https://new.example.org' })).toBeDefined();
  });
});
