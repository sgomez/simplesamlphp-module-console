import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { expect } from 'vitest';
import type { EditedEntity } from '../../domain/entities';
import { EDIT, ENTITY, PHP, SAVE, VALIDATE, entity, posted, session, stubApi, validation } from './api';
import { renderAt } from './render';

type Answers = Parameters<typeof stubApi>[0];

export function serveEdit(object: EditedEntity = entity(), more: Answers = {}) {
  return stubApi({ '/api/session': { body: session }, [ENTITY]: { body: object }, [VALIDATE]: { body: validation() }, ...more });
}

export async function openEdit(object?: EditedEntity, more?: Answers) {
  const fetch = serveEdit(object, more);
  renderAt(EDIT);
  await screen.findByRole('textbox', { name: 'PHP' });

  return fetch;
}

export function editor(): HTMLTextAreaElement {
  return screen.getByRole('textbox', { name: 'PHP' }) as HTMLTextAreaElement;
}

export function saveBar(): HTMLElement {
  return document.querySelector('.save-bar') as HTMLElement;
}

export const EDITED = `${PHP}\n`;

// Opens the screen, edits it and saves; the session counts pendingAfter changes once saved.
export async function saveWith(answer: { status?: number; body: unknown }, pendingAfter = 1, more: Answers = {}) {
  let sessions = 0;
  const fetch = await openEdit(entity(), {
    '/api/session': () => ({ body: { ...session, pendingCount: sessions++ === 0 ? 0 : pendingAfter } }),
    [SAVE]: answer,
    ...more,
  });
  fireEvent.change(editor(), { target: { value: EDITED } });
  fireEvent.click(within(saveBar()).getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(posted(fetch, SAVE)).toBeDefined());

  return fetch;
}
