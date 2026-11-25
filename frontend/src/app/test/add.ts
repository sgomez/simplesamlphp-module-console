import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { expect } from 'vitest';
import { ENTITY, SAVE, VALIDATE, entity, posted, session, stubApi, validation } from './api';
import { editor, saveBar } from './edit';
import { renderAt } from './render';

export const NEW = '/entities/saml20-sp-remote/new';
export const STARTER = "$metadata[''] = [\n    'AssertionConsumerService' => [],\n];";
export const TYPED = "$metadata['https://new.example.org'] = [\n    'AssertionConsumerService' => [],\n];";
export const CREATED = '/entities/saml20-sp-remote/edit?entityid=https%3A%2F%2Fnew.example.org';

export const starter = entity({ entityId: '', name: null, version: 0, state: null, php: STARTER });
export const created = entity({
  entityId: 'https://new.example.org',
  name: null,
  php: TYPED,
  notices: [{ message: "Did you mean 'SingleLogoutService'?", option: 'SingleLogoutServices', line: 3 }],
});

type Answers = Parameters<typeof stubApi>[0];

export async function openNew(more: Answers = {}, before: string[] = []) {
  const fetch = stubApi({
    '/api/session': { body: session },
    [ENTITY]: { body: starter },
    [VALIDATE]: { body: validation() },
    ...more,
  });
  renderAt(NEW, before);
  await screen.findByRole('textbox', { name: 'PHP' });

  return fetch;
}

export async function saveNew(answer: { status?: number; body: unknown }, more: Answers = {}, before: string[] = []) {
  const fetch = await openNew({ [SAVE]: answer, ...more }, before);
  fireEvent.change(editor(), { target: { value: TYPED } });
  fireEvent.click(within(saveBar()).getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(posted(fetch, SAVE)).toBeDefined());

  return fetch;
}
