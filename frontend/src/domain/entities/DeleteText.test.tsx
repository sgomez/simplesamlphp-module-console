import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EDIT, entity, page, session, sp, stubApi } from '../../app/test/api';
import { BAD, DELETE, chooseDelete, gone, withDialogs } from '../../app/test/delete';
import { openEdit, serveEdit } from '../../app/test/edit';
import { renderAt } from '../../app/test/render';
import { LIST } from '../../app/test/states';

const SERVED = ' Nodes keep serving it until the next Publication, which withdraws it.';

function text(dialog: HTMLElement) {
  return dialog.querySelector('.dialog-text')?.textContent;
}

async function askOnList(inSnapshot: boolean) {
  const row = sp(BAD, { state: 'Unreadable', unreadable: true, inSnapshot, error: 'The stored document is not valid JSON.' });
  stubApi({ '/api/session': { body: session }, [`/api${LIST}`]: { body: page([row]) } });
  renderAt(LIST);
  fireEvent.click(await screen.findByRole('button', { name: 'Delete…' }));

  return screen.getByRole('dialog', { name: `Delete ${BAD}?` });
}

async function askOnUnreadable(inSnapshot: boolean) {
  serveEdit(entity({ state: 'Unreadable', php: null, unreadable: true, inSnapshot, error: 'The document is not valid JSON.' }));
  renderAt(EDIT);
  await screen.findByRole('alert');
  await chooseDelete();

  return screen.getByRole('dialog');
}

describe('the confirmation text, by whether the object is in the current Snapshot', () => {
  withDialogs();

  it('does not say nodes serve an Unpublished object', async () => {
    await openEdit(entity({ state: 'Unpublished' }), { [DELETE]: gone });

    await chooseDelete();

    const dialog = screen.getByRole('dialog', { name: 'Delete Example?' });
    expect(text(dialog)).toBe('Example is removed from the Console.');
    expect(within(dialog).getByRole('button', { name: 'Delete Example' })).toBeDefined();
  });

  it('says nodes keep serving an object that is in the current Snapshot', async () => {
    await openEdit(entity({ state: 'Up to date' }), { [DELETE]: gone });

    await chooseDelete();

    expect(text(screen.getByRole('dialog'))).toBe(`Example is removed from the Console.${SERVED}`);
  });

  it('says nodes keep serving a disabled object until the Publication that withdraws it', async () => {
    await openEdit(entity({ state: null, inSnapshot: true }), { [DELETE]: gone });

    await chooseDelete();

    expect(text(screen.getByRole('dialog'))).toBe(`Example is removed from the Console.${SERVED}`);
  });

  it('does not say nodes serve a disabled object already withdrawn', async () => {
    await openEdit(entity({ state: null, inSnapshot: false }), { [DELETE]: gone });

    await chooseDelete();

    expect(text(screen.getByRole('dialog'))).toBe('Example is removed from the Console.');
  });

  it('does not say nodes serve an Unreadable object never published', async () => {
    expect(text(await askOnUnreadable(false))).toBe('Example is removed from the Console.');
  });

  it('says nodes keep serving an Unreadable object in the current Snapshot', async () => {
    expect(text(await askOnUnreadable(true))).toBe(`Example is removed from the Console.${SERVED}`);
  });

  it('does the same for an Unreadable row of the list', async () => {
    expect(text(await askOnList(false))).toBe(`${BAD} is removed from the Console.`);
  });

  it('says nodes keep serving an Unreadable row of the list that is in the current Snapshot', async () => {
    const dialog = await askOnList(true);

    expect(text(dialog)).toBe(`${BAD} is removed from the Console.${SERVED}`);
    expect(within(dialog).getByRole('button', { name: `Delete ${BAD}` })).toBeDefined();
  });

  it('hands the focus back to More actions when the dialog closes', async () => {
    await openEdit(entity(), { [DELETE]: gone });
    await chooseDelete();

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'More actions' }));
  });
});
