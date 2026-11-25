import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PHP, VALIDATE, entity, posted, validation } from '../../test/api';
import { editor, openEdit, saveBar } from '../../test/edit';

const typed = `${PHP}\n'x' => 1,`;

describe('validation while editing', () => {
  it('checks the text through the API once typing pauses, and marks what it finds', async () => {
    const fetch = await openEdit(entity(), {
      [VALIDATE]: {
        body: validation({
          errors: [{ pointer: '/x', message: 'Not an option.', line: 4, column: null }],
          notices: [{ message: "Did you mean 'y'?", option: 'x', line: 4 }],
          warnings: [{ label: 'Uses extra', message: 'The entity uses extra.' }],
        }),
      },
    });

    fireEvent.change(editor(), { target: { value: 'first' } });
    fireEvent.change(editor(), { target: { value: typed } });

    expect(await screen.findByText('Not an option.')).toBeDefined();
    expect(fetch.mock.calls.filter(([input]) => String(input) === VALIDATE)).toHaveLength(1);
    expect(posted(fetch, VALIDATE)).toEqual({ entityid: 'https://sp.example.org', php: typed });
    expect(screen.getByText("Did you mean 'y'?").parentElement?.className).toBe('msg-warning');
    expect(screen.getByText('The entity uses extra.')).toBeDefined();
    expect([...document.querySelectorAll('.ed-ln.err')].map((line) => line.textContent)).toEqual(['×4']);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(within(saveBar()).getByRole('button', { name: 'Save' }).hasAttribute('disabled')).toBe(false);
  });

  it('marks a line with only warnings as a warning', async () => {
    await openEdit(entity(), {
      [VALIDATE]: { body: validation({ notices: [{ message: 'Dropped.', option: 'expire', line: 2 }] }) },
    });

    fireEvent.change(editor(), { target: { value: typed } });

    await screen.findByText('Dropped.');
    expect([...document.querySelectorAll('.ed-ln.warn')].map((line) => line.textContent)).toEqual(['!2']);
  });

  it('does not check the text as it was opened', async () => {
    const fetch = await openEdit();

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(fetch.mock.calls.filter(([input]) => String(input) === VALIDATE)).toHaveLength(0);
  });

  it('drops a late answer for a text that has changed since', async () => {
    let answers = 0;
    const served = await openEdit(entity(), {
      [VALIDATE]: () => {
        answers += 1;

        return { body: validation({ errors: [{ pointer: '', message: `Answer ${answers}`, line: 1, column: null }] }) };
      },
    });
    const gate: { open?: () => void } = {};
    const held = new Promise<void>((resolve) => {
      gate.open = resolve;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input, init) => {
        const answer = await served(input, init);
        if (answers === 1) {
          await held;
        }

        return answer;
      }),
    );

    fireEvent.change(editor(), { target: { value: typed } });
    await waitFor(() => expect(answers).toBe(1));
    fireEvent.change(editor(), { target: { value: `${typed}\n` } });
    await waitFor(() => expect(answers).toBe(2));
    gate.open?.();

    expect(await screen.findByText('Answer 2')).toBeDefined();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByText('Answer 1')).toBeNull();
  });
});
