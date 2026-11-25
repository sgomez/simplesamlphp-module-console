import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { edited, savedPhp, unknownOption } from '../app/adapters/memory/edited';
import type { MemoryEntities } from '../app/adapters/memory/entities';
import { withDialogs } from '../app/test/delete';
import { EDIT_ROUTE, EditFrame } from '../app/test/EditFrame';
import { editor, saveBar } from '../app/test/edit';
import { LinkRouter } from '../design-system/LinkRouter';

async function open(entities: MemoryEntities) {
  render(
    <MemoryRouter initialEntries={[EDIT_ROUTE]}>
      <LinkRouter>
        <EditFrame entities={entities} pending={3} />
      </LinkRouter>
    </MemoryRouter>,
  );
  await screen.findByRole('textbox', { name: 'PHP' });
}

function save() {
  fireEvent.change(editor(), { target: { value: `${editor().value} ` } });
  fireEvent.click(within(saveBar()).getByRole('button', { name: 'Save' }));
}

async function choose(entry: string) {
  fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
  fireEvent.click(await screen.findByRole('menuitem', { name: entry }));

  return screen.findByRole('dialog');
}

describe('the edit screen with the capabilities the API does not serve yet', () => {
  withDialogs();

  it('says the tidied text once, until asked not to', async () => {
    const saved = edited({ php: savedPhp, version: 5, notices: [unknownOption] });
    await open({ entities: [edited()], save: () => ({ kind: 'saved', entity: saved, tidied: { comments: 1 } }) });
    save();

    expect(await screen.findByText('Formatting was tidied and 1 comment was removed')).toBeDefined();
    expect(screen.getAllByRole('link', { name: 'Review 3 changes' })).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Do not show again' }));
    expect(screen.queryByText('Formatting was tidied and 1 comment was removed')).toBeNull();
    expect(screen.getByText('Saved. Not live yet.')).toBeDefined();
  });

  it('says Formatting was tidied when no comment was removed', async () => {
    await open({ entities: [edited()], save: () => ({ kind: 'saved', entity: edited(), tidied: { comments: 0 } }) });
    save();

    expect(await screen.findByText('Formatting was tidied')).toBeDefined();
  });

  it('puts the suggested option in place of an unknown one', async () => {
    await open({ entities: [edited({ php: savedPhp, notices: [unknownOption] })] });

    fireEvent.click(screen.getByRole('link', { name: 'sign.logout' }));

    expect(editor().value).toContain("    'sign.logout' => true,");
    expect(editor().value).not.toContain('sing.logout');
  });

  it('says who saved the object meanwhile, and when', async () => {
    const by = { identity: 'alice', at: new Date(Date.now() - 300000) };
    await open({ entities: [edited()], save: () => ({ kind: 'race', entity: edited({ version: 9 }), by }) });
    save();

    expect(await screen.findByText('alice saved it 5 minutes ago. Your edits were not kept.')).toBeDefined();
  });

  it('enables and disables the object with the switch', async () => {
    await open({ entities: [edited({ state: 'Up to date' })] });

    fireEvent.click(screen.getByRole('switch', { name: 'Enabled' }));

    await waitFor(() => expect((screen.getByRole('switch', { name: 'Enabled' }) as HTMLInputElement).checked).toBe(false));
    expect(within(saveBar()).getByText('Saved, not live')).toBeDefined();
  });

  it('discards the changes once confirmed, or keeps them', async () => {
    await open({ entities: [edited({ state: 'Unpublished' })] });

    let dialog = await choose('Discard changes…');
    expect(within(dialog).getByText('Moodle is disabled and stays saved as Not live.')).toBeDefined();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Keep changes' }));
    expect(screen.queryByRole('dialog')).toBeNull();

    dialog = await choose('Discard changes…');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Discard changes' }));

    await waitFor(() => expect((screen.getByRole('switch', { name: 'Enabled' }) as HTMLInputElement).checked).toBe(false));
  });

  it('promotes the next key once confirmed', async () => {
    await open({ entities: [edited({ nextKey: true, state: 'Up to date' })] });

    const dialog = await choose('Promote…');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Promote' }));

    await waitFor(() => expect(within(saveBar()).getByText('Saved, not live')).toBeDefined());
  });

  it('says what went wrong with an action', async () => {
    await open({ entities: [edited()], failing: { status: 500, body: null } });

    fireEvent.click(screen.getByRole('switch', { name: 'Enabled' }));

    expect(await screen.findByText('Not disabled: the server answered 500.')).toBeDefined();
    expect((screen.getByRole('switch', { name: 'Enabled' }) as HTMLInputElement).checked).toBe(true);
  });
});
