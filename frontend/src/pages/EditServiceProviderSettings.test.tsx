import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { MemoryEntities } from '../app/adapters/memory/entities';
import { settingsEntity, settingsRefusal } from '../app/adapters/memory/settings';
import { EDIT_ROUTE, EditFrame } from '../app/test/EditFrame';
import { openEdit, saveBar } from '../app/test/edit';
import { LinkRouter } from '../design-system/LinkRouter';
import type { Draft } from '../domain/entities';

async function open(entities: MemoryEntities) {
  render(
    <MemoryRouter initialEntries={[EDIT_ROUTE]}>
      <LinkRouter>
        <EditFrame entities={entities} />
      </LinkRouter>
    </MemoryRouter>,
  );
  await screen.findByRole('radiogroup', { name: 'View' });
}

const nameFormat = () => screen.getByLabelText('Attribute name format');
const code = () => screen.getByLabelText('PHP', { selector: 'pre' });

describe('the Settings view of the edit screen', () => {
  it('is not offered by the API yet', async () => {
    await openEdit();

    expect(screen.queryByRole('radiogroup', { name: 'View' })).toBeNull();
  });

  it('opens in the view last used, with the PHP beside the form', async () => {
    await open({ entities: [settingsEntity()] });

    expect(screen.getByRole('radio', { name: 'Settings' }).getAttribute('aria-checked')).toBe('true');
    expect(nameFormat()).toBeDefined();
    expect(code().textContent).toContain("'attributes.NameFormat' => 'urn:oasis:names:tc:SAML:2.0:attrname-format:uri',");
    expect(within(saveBar()).getByRole('button', { name: 'Save' }).hasAttribute('disabled')).toBe(true);
  });

  it('translates an edit once typing pauses, and saves its PHP', async () => {
    const sent: Draft[] = [];
    await open({
      entities: [settingsEntity()],
      save: (draft, stored) => {
        sent.push(draft);

        return { kind: 'saved', entity: { ...settingsEntity(), ...stored, php: draft.php, version: 5 } };
      },
    });

    fireEvent.change(nameFormat(), { target: { value: 'basic' } });
    expect(within(saveBar()).getByText('Unsaved edits')).toBeDefined();
    await waitFor(() => expect(code().textContent).toContain("'attributes.NameFormat' => 'basic',"));
    fireEvent.click(within(saveBar()).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Saved. Not live yet.')).toBeDefined();
    expect(sent[0]?.php).toContain("'attributes.NameFormat' => 'basic',");
  });

  it('switches to PHP with the edits, and back', async () => {
    await open({ entities: [settingsEntity()] });

    fireEvent.change(nameFormat(), { target: { value: 'basic' } });
    fireEvent.click(screen.getByRole('radio', { name: 'PHP' }));

    const editor = (await screen.findByRole('textbox', { name: 'PHP' })) as HTMLTextAreaElement;
    expect(editor.value).toContain("'attributes.NameFormat' => 'basic',");
    fireEvent.click(screen.getByRole('radio', { name: 'Settings' }));
    await waitFor(() => expect((nameFormat() as HTMLInputElement).value).toBe('basic'));
  });

  it('keeps Settings closed while the text cannot be read', async () => {
    await open({ entities: [settingsEntity({ view: 'php' })], validate: (php) => ({ errors: [], notices: [], warnings: [], readable: !php.includes('{') }) });

    fireEvent.change(screen.getByRole('textbox', { name: 'PHP' }), { target: { value: '$metadata[{' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Settings' }));

    expect(await screen.findByText('Settings opens once the text can be read')).toBeDefined();
    expect(screen.getByRole('radio', { name: 'Settings' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('textbox', { name: 'PHP' })).toBeDefined();
  });

  it('lists the errors of a refused save, each linked to its field, and keeps the edits', async () => {
    await open({ entities: [settingsEntity()], save: () => ({ kind: 'invalid', refusal: settingsRefusal }) });

    fireEvent.change(nameFormat(), { target: { value: 'basic' } });
    fireEvent.click(within(saveBar()).getByRole('button', { name: 'Save' }));

    const callout = (await screen.findByText('Not saved: 1 error')).closest('.callout') as HTMLElement;
    expect(within(callout).getByRole('link', { name: 'attributes.NameFormat' }).getAttribute('href')).toBe('#o-attributes.NameFormat');
    expect(within(document.getElementById('o-attributes.NameFormat') as HTMLElement).getByText('Not a URI the IdP understands.')).toBeDefined();
  });

  it('discards the edits of the form', async () => {
    await open({ entities: [settingsEntity()] });

    fireEvent.change(nameFormat(), { target: { value: 'basic' } });
    fireEvent.click(within(saveBar()).getByRole('button', { name: 'Discard edits' }));

    expect((nameFormat() as HTMLInputElement).value).toBe('urn:oasis:names:tc:SAML:2.0:attrname-format:uri');
    expect(within(saveBar()).queryByText('Unsaved edits')).toBeNull();
  });
});
