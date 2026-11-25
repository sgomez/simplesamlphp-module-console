import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SAVE, entity, posted } from '../app/test/api';
import { EDITED, editor, saveBar, saveWith } from '../app/test/edit';

describe('saving the edit screen', () => {
  it('sends the entity ID, the version it was loaded with and the text', async () => {
    const fetch = await saveWith({ body: entity({ version: 2 }) });

    expect(posted(fetch, SAVE)).toEqual({ entityid: 'https://sp.example.org', version: 1, php: EDITED });
  });

  it('shows the saved object with a message and the Pending changes to review', async () => {
    const saved = entity({ version: 2, php: 'normalised', name: 'Renamed', state: 'Modified' });
    await saveWith({ body: saved });

    const callout = (await screen.findByText('Saved. Not live yet.')).closest('.callout') as HTMLElement;
    const review = await within(callout).findByRole('link', { name: 'Review 1 change' });

    expect(callout.className).toBe('callout callout-success');
    expect(review.className).toBe('btn btn-secondary btn-sm');
    expect(review.getAttribute('href')).toBe('/publish');
    expect(editor().value).toBe('normalised');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Renamed');
    expect(within(saveBar()).getByText('Saved, not live')).toBeDefined();
  });

  it('saves the next edit on the version the last save answered', async () => {
    const fetch = await saveWith({ body: entity({ version: 2, php: 'normalised' }) });
    await screen.findByText('Saved. Not live yet.');

    fireEvent.change(editor(), { target: { value: 'again' } });
    fireEvent.click(within(saveBar()).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(posted(fetch, SAVE, 1)).toEqual({ entityid: 'https://sp.example.org', version: 2, php: 'again' }));
  });

  it('shows the object as it now stands after a lost race, and says so', async () => {
    await saveWith({ status: 409, body: entity({ version: 3, php: 'theirs', name: 'Theirs', state: 'Modified' }) });

    const callout = await screen.findByRole('alert');

    expect(within(callout).getByText('Not saved: Theirs changed meanwhile')).toBeDefined();
    expect(within(callout).getByText('This is Theirs as it now stands. Your edits were not kept.')).toBeDefined();
    expect(editor().value).toBe('theirs');
    expect(within(saveBar()).getByRole('button', { name: 'Save' }).hasAttribute('disabled')).toBe(true);
  });

  it('says Not found, naming the entity, when it was deleted meanwhile', async () => {
    await saveWith({ status: 404, body: { error: 'not found' } });

    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe('Not found');
    expect(screen.getByText('https://sp.example.org').className).toBe('mono wrap-any');
  });
});
