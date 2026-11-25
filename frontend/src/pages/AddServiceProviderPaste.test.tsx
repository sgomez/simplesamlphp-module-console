import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { boardXml, starter, travelbooker } from '../app/adapters/memory/added';
import type { MemoryEntities } from '../app/adapters/memory/entities';
import { ADD_ROUTE, AddFrame } from '../app/test/AddFrame';
import { editor, saveBar } from '../app/test/edit';
import { LinkRouter } from '../design-system/LinkRouter';

const LABEL = 'Metadata XML or PHP array';

async function open(entities: MemoryEntities = {}) {
  render(
    <MemoryRouter initialEntries={[ADD_ROUTE]}>
      <LinkRouter>
        <AddFrame entities={entities} />
      </LinkRouter>
    </MemoryRouter>,
  );

  return screen.findByRole('textbox', { name: LABEL });
}

describe('adding a service provider from pasted configuration', () => {
  it('opens on Paste, with Review off until something is pasted', async () => {
    const area = await open();

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Add service provider');
    expect(screen.getByRole('link', { name: 'Paste' }).getAttribute('aria-current')).toBe('true');
    expect(area.getAttribute('placeholder')).toBe(LABEL);
    expect(screen.getByRole('button', { name: 'Review' }).hasAttribute('disabled')).toBe(true);
    expect(screen.queryByRole('combobox', { name: 'Detected' })).toBeNull();
  });

  it('shows the detected format, which the administrator can correct before Review', async () => {
    const pasted = vi.fn(() => ({ ok: true as const, data: travelbooker }));
    fireEvent.change(await open({ pasted }), { target: { value: boardXml } });
    const detected = screen.getByRole('combobox', { name: 'Detected' });

    expect((detected as HTMLSelectElement).value).toBe('SAML metadata · 1 entity');

    fireEvent.change(detected, { target: { value: 'PHP array' } });
    fireEvent.click(screen.getByRole('button', { name: 'Review' }));

    await waitFor(() => expect(pasted).toHaveBeenCalledWith(boardXml, 'php'));
  });

  it('opens the editor filled with what was read, unsaved', async () => {
    fireEvent.change(await open(), { target: { value: boardXml } });
    fireEvent.click(screen.getByRole('button', { name: 'Review' }));

    await waitFor(() => expect(editor().value).toBe(travelbooker.php));
    expect(within(saveBar()).getByText('Unsaved')).toBeDefined();
    expect(within(saveBar()).getByRole('button', { name: 'Cancel' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Add service provider');
  });

  it('says why the input was not read, and keeps it', async () => {
    const area = await open({ pasted: () => ({ ok: false, status: 500, body: null }) });
    fireEvent.change(area, { target: { value: boardXml } });
    fireEvent.click(screen.getByRole('button', { name: 'Review' }));

    expect(await screen.findByText('Not read: the server answered 500.')).toBeDefined();
    expect((area as HTMLTextAreaElement).value).toBe(boardXml);
  });

  it('reads an uploaded file in the browser into the text area', async () => {
    await open();
    fireEvent.click(screen.getByRole('link', { name: 'Upload' }));
    await screen.findByRole('button', { name: 'Choose file' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([boardXml], 'metadata.xml', { type: 'text/xml' });

    fireEvent.change(input, { target: { files: { 0: file, length: 1, item: () => file } } });

    const area = await screen.findByRole('textbox', { name: LABEL });
    await waitFor(() => expect((area as HTMLTextAreaElement).value).toBe(boardXml));
    expect(screen.getByRole('link', { name: 'Paste' }).getAttribute('aria-current')).toBe('true');
  });

  it('opens the starter editor on Start empty', async () => {
    await open();
    fireEvent.click(screen.getByRole('link', { name: 'Start empty' }));

    await waitFor(() => expect(editor().value).toBe(starter.php));
  });

  it('offers only the starter editor when the server cannot read pasted configuration', async () => {
    render(
      <MemoryRouter initialEntries={[ADD_ROUTE]}>
        <LinkRouter>
          <AddFrame entities={{ served: true }} />
        </LinkRouter>
      </MemoryRouter>,
    );

    await waitFor(() => expect(editor().value).toBe(starter.php));
    expect(screen.queryByRole('textbox', { name: LABEL })).toBeNull();
  });
});
