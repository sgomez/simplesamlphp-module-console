import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PHP } from '../app/test/api';
import { editor, openEdit } from '../app/test/edit';

function panel(): HTMLElement {
  return screen.getByRole('heading', { name: 'Options' }).parentElement as HTMLElement;
}

function row(name: string): HTMLElement {
  return within(panel()).getByText(name, { selector: '.mono' }).closest('.row') as HTMLElement;
}

describe('the Options panel of the PHP view', () => {
  it('lists the options of the schema with their titles, a set one with its line', async () => {
    await openEdit();

    expect(within(row('name')).getByText('Name').className).toBe('xs muted');
    expect(within(row('name')).getByText('Line 2').className).toBe('xs faint option-at');
    expect(within(row('ForceAuthn')).getByText('boolean · default')).toBeDefined();
    expect(within(row('ForceAuthn')).getByRole('button', { name: 'Insert ForceAuthn' })).toBeDefined();
    expect(within(panel()).queryByText('extra')).toBeNull();
  });

  it('finds options by name or title', async () => {
    await openEdit();

    fireEvent.change(within(panel()).getByRole('searchbox', { name: 'Search options' }), { target: { value: 'LOGOUT' } });

    expect([...panel().querySelectorAll('.option-main > .mono')].map((name) => name.textContent)).toEqual([
      'SingleLogoutService',
      'sign.logout',
      'validate.logout',
      'core:logout-timeout',
    ]);
    fireEvent.change(within(panel()).getByRole('searchbox'), { target: { value: 'nothing like it' } });
    expect(panel().querySelector('.card')).toBeNull();
  });

  it('inserts an option with its default at the cursor, and shows its line once set', async () => {
    await openEdit();
    const text = editor();
    text.focus();
    text.setSelectionRange(PHP.indexOf("    'name'"), PHP.indexOf("    'name'"));

    fireEvent.click(within(row('ForceAuthn')).getByRole('button', { name: 'Insert ForceAuthn' }));

    expect(editor().value).toBe("$metadata['https://sp.example.org'] = [\n    'name' => 'Example',\n    'ForceAuthn' => false,\n];");
    expect(within(row('ForceAuthn')).getByText('Line 3')).toBeDefined();
    expect(document.activeElement).toBe(editor());
    expect(editor().selectionStart).toBe(editor().value.indexOf('false,') + 'false,'.length);
  });

  it('inserts last when the editor was never focused', async () => {
    await openEdit();

    fireEvent.click(within(row('sign.logout')).getByRole('button', { name: 'Insert sign.logout' }));

    expect(editor().value.split('\n').at(-2)).toBe("    'sign.logout' => false,");
  });

  it('offers Download and Delete only, and no Enabled switch, where the API serves nothing more', async () => {
    await openEdit();

    fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
    const items = await screen.findAllByRole('menuitem');

    expect(items.map((item) => item.textContent)).toEqual(['Download', 'Delete…']);
    expect(screen.queryByRole('switch')).toBeNull();
  });
});
