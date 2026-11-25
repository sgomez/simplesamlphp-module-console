import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PHP, VALIDATE, posted, saveRefusal, validation } from '../../app/test/api';
import { EDITED, editor, saveBar, saveWith } from '../../app/test/edit';

describe('a save with errors', () => {
  it('keeps the text and lists every error with its line after a save with errors', async () => {
    await saveWith({
      status: 422,
      body: saveRefusal({
        errors: [
          { pointer: '/NameIDFormat', message: 'Choose one of the allowed values.', line: 3, column: null },
          { pointer: '/AssertionConsumerService/0/Location', message: 'Enter the full URL.', line: 2, column: null },
        ],
      }),
    });

    const callout = await screen.findByRole('alert');
    const lines = [...document.querySelectorAll('.mark-line')].map((link) => link.textContent);

    expect(within(callout).getByText('Not saved: 2 errors')).toBeDefined();
    expect(lines).toEqual(['Line 2', 'Line 3']);
    expect(screen.getByText('AssertionConsumerService').className).toBe('mono');
    expect([...document.querySelectorAll('.ed-ln.err')].map((line) => line.textContent)).toEqual(['×2', '×3']);
    expect(editor().value).toBe(EDITED);
    expect(within(saveBar()).getByText('Unsaved edits')).toBeDefined();
  });

  it('says a text that cannot be read was not read, with the column of the error', async () => {
    await saveWith({
      status: 422,
      body: saveRefusal({ readable: false, errors: [{ pointer: '', message: 'A comma is missing.', line: 2, column: 5 }] }),
    });

    expect(await screen.findByText('Not saved: the text could not be read')).toBeDefined();
    expect(screen.getByText('Nothing else is checked until this is fixed.')).toBeDefined();
    expect(screen.getByText('Column 5: A comma is missing.')).toBeDefined();
  });

  it('moves the caret to the line of an error', async () => {
    await saveWith({
      status: 422,
      body: saveRefusal({ errors: [{ pointer: '/name', message: 'Wrong.', line: 2, column: null }] }),
    });

    fireEvent.click(await screen.findByRole('link', { name: 'Line 2' }));

    expect(document.activeElement).toBe(editor());
    expect(editor().selectionStart).toBe(PHP.indexOf("    'name'"));
  });

  it('checks the text once more so its warnings come back with the errors', async () => {
    const fetch = await saveWith(
      { status: 422, body: saveRefusal({ errors: [{ pointer: '/name', message: 'Wrong.', line: 2, column: null }] }) },
      1,
      { [VALIDATE]: { body: validation({ warnings: [{ label: 'Uses extra', message: 'The entity uses extra.' }] }) } },
    );

    expect(await screen.findByText('The entity uses extra.')).toBeDefined();
    expect(screen.getByText('Wrong.').parentElement?.className).toBe('msg-error');
    expect(posted(fetch, VALIDATE)).toEqual({ entityid: 'https://sp.example.org', php: EDITED });
  });
});
