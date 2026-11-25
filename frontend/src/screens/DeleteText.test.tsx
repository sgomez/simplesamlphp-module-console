import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EDIT, entity, page, session, sp, stubApi } from '../test/api';
import { BAD, DELETE, chooseDelete, gone, withDialogs } from '../test/delete';
import { openEdit, serveEdit } from '../test/edit';
import { renderAt } from '../test/render';
import { LIST } from '../test/states';

function text(dialog: HTMLElement) {
  return dialog.querySelector('.dialog-text')?.textContent;
}

describe('the confirmation text of an object never published', () => {
  withDialogs();

  it('does not say nodes serve an Unpublished object', async () => {
    await openEdit(entity({ state: 'Unpublished' }), { [DELETE]: gone });

    chooseDelete();

    const dialog = screen.getByRole('dialog', { name: 'Delete Example?' });
    expect(text(dialog)).toBe('Example is removed from the Console.');
    expect(within(dialog).getByRole('button', { name: 'Delete Example' })).toBeDefined();
  });

  it('says nodes keep serving an object that is in the current Snapshot', async () => {
    await openEdit(entity({ state: 'Up to date' }), { [DELETE]: gone });

    chooseDelete();

    expect(text(screen.getByRole('dialog'))).toBe(
      'Example is removed from the Console. Nodes keep serving it until the next Publication, which withdraws it.',
    );
  });

  it('does not say nodes serve an Unpublished Unreadable row', async () => {
    const row = sp(BAD, { state: 'Unpublished', unreadable: true, error: 'The stored document is not valid JSON.' });
    stubApi({ '/api/session': { body: session }, [`/api${LIST}`]: { body: page([row]) } });
    renderAt(LIST);

    fireEvent.click(await screen.findByRole('button', { name: 'Delete…' }));

    expect(text(screen.getByRole('dialog'))).toBe(`${BAD} is removed from the Console.`);
  });

  it('says neither that an Unreadable object is live nor that it is not', async () => {
    serveEdit(entity({ state: 'Unreadable', php: null, unreadable: true, error: 'The document is not valid JSON.' }));
    renderAt(EDIT);
    await screen.findByRole('alert');

    chooseDelete();

    expect(text(screen.getByRole('dialog'))).toBe('Example is removed from the Console.');
  });

  it('says neither for an Unreadable row of the list', async () => {
    const row = sp(BAD, { state: 'Unreadable', unreadable: true, error: 'The stored document is not valid JSON.' });
    stubApi({ '/api/session': { body: session }, [`/api${LIST}`]: { body: page([row]) } });
    renderAt(LIST);

    fireEvent.click(await screen.findByRole('button', { name: 'Delete…' }));

    expect(text(screen.getByRole('dialog'))).toBe(`${BAD} is removed from the Console.`);
  });

  it('hands the focus back to More actions when the dialog closes', async () => {
    await openEdit(entity(), { [DELETE]: gone });
    chooseDelete();

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'More actions' }));
  });
});
