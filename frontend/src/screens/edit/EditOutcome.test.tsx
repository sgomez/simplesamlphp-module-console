import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SAVE, entity, refusal, saveRefusal } from '../../test/api';
import { EDITED, editor, openEdit, saveBar, saveWith } from '../../test/edit';

describe('the outcome of a save', () => {
  it('says the server answered with another status, and keeps the edits', async () => {
    await saveWith({ status: 500, body: { error: 'x' } });

    const callout = await screen.findByRole('alert');

    expect(within(callout).getByText('Not saved: the server answered 500.')).toBeDefined();
    expect(editor().value).toBe(EDITED);
    expect(within(saveBar()).getByText('Unsaved edits')).toBeDefined();
  });

  it('shows the state page when the database is not ready', async () => {
    await saveWith(refusal());

    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe('The database needs an update');
    expect(screen.queryByRole('textbox', { name: 'PHP' })).toBeNull();
  });

  it('says the Console could not be reached when no answer came', async () => {
    await saveWith({ status: 200, body: null }, 1, {
      [SAVE]: () => {
        throw new TypeError('offline');
      },
    });

    expect(await screen.findByText('Not saved: the Console could not be reached.')).toBeDefined();
    expect(within(saveBar()).getByText('Unsaved edits')).toBeDefined();
  });

  it('clears a refusal as soon as the text changes', async () => {
    await saveWith({ status: 422, body: saveRefusal({ errors: [{ pointer: '', message: 'Bad.', line: 1, column: null }] }) });
    await screen.findByText('Not saved: 1 error');

    fireEvent.change(editor(), { target: { value: 'other' } });

    expect(screen.queryByText('Not saved: 1 error')).toBeNull();
  });

  it('clears the saved message as soon as the text changes', async () => {
    await saveWith({ body: entity({ version: 2, php: 'saved' }) });
    await screen.findByText('Saved. Not live yet.');

    fireEvent.change(editor(), { target: { value: 'other' } });

    expect(screen.queryByText('Saved. Not live yet.')).toBeNull();
  });

  it('holds the editor read-only while a save is in flight', async () => {
    const answer: { send?: (response: Response) => void } = {};
    const fetch = await openEdit();
    const served = fetch.getMockImplementation();
    fetch.mockImplementation(async (input, init) =>
      String(input) === SAVE
        ? new Promise<Response>((resolve) => {
            answer.send = resolve;
          })
        : (served as typeof globalThis.fetch)(input, init),
    );

    fireEvent.change(editor(), { target: { value: EDITED } });
    fireEvent.click(within(saveBar()).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(editor().hasAttribute('readonly')).toBe(true));
    expect(editor().getAttribute('aria-busy')).toBe('true');
    answer.send?.(new Response(JSON.stringify(entity({ version: 2, php: 'saved' })), { status: 200 }));
    await waitFor(() => expect(editor().hasAttribute('readonly')).toBe(false));
    vi.restoreAllMocks();
  });
});
