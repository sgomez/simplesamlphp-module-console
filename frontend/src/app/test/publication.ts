import { screen } from '@testing-library/react';
import type { PublicationReview } from '../../domain/publication';
import { review, session, stubApi } from './api';
import { renderAt } from './render';

export const PUBLISH = '/publish';
export const EDIT_A = '/entities/saml20-sp-remote/edit?entityid=https%3A%2F%2Fa.example.org';
export const EDIT_M = '/entities/saml20-sp-remote/edit?entityid=https%3A%2F%2Fm.example.org';
export const CURRENT = { number: 41, createdAt: '2026-11-20 10:15:00' };

export const ready = review({
  groups: [
    { state: 'Unpublished', changes: [{ entityId: 'https://a.example.org', name: 'Alpha', loadError: null, opens: true }] },
    { state: 'Modified', changes: [{ entityId: 'https://m.example.org', name: null, loadError: null, opens: true }] },
    { state: 'Deleted', changes: [{ entityId: 'https://d.example.org', name: 'Delta', loadError: null, opens: false }] },
    { state: 'Unreadable', changes: [{ entityId: 'https://u.example.org', name: null, loadError: 'Syntax error', opens: false }] },
  ],
  hash: 'h1',
  nextNumber: 42,
  current: CURRENT,
  canPublish: true,
});

type Post = { status?: number; body: unknown };

// GET answers the reviews in turn, the last one for good; a POST gets the given answer.
export function servePublication(reviews: PublicationReview[], post: Post = { body: { number: 42, build: null } }) {
  const queue = [...reviews];

  return stubApi({
    '/api/session': { body: { ...session, pendingCount: 4, current: CURRENT } },
    '/api/publication': (_url, init) =>
      init?.method === 'POST' ? post : { body: queue.length > 1 ? queue.shift() : queue[0] },
  });
}

export function calls(fetch: ReturnType<typeof servePublication>, path: string, method = 'GET') {
  return fetch.mock.calls.filter(([url, init]) => url === path && (init?.method ?? 'GET') === method);
}

export async function shown(): Promise<HTMLElement> {
  renderAt(PUBLISH);

  return screen.findByRole('complementary', { name: 'This Publication' });
}
