import { fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect } from 'vitest';
import type { Migration, MigrationRun } from '../../domain/database';
import { page, refusal, session, stubApi } from './api';

export const LIST = '/entities/saml20-sp-remote';

export const PENDING: Migration[] = [
  { number: 7, title: 'Create console_audit' },
  { number: 8, title: 'Create the index console_audit_entity' },
  { number: 9, title: 'Create the index console_audit_authsource' },
];

type RefusalFields = Parameters<typeof refusal>[0];

export function serveState(more: RefusalFields) {
  return stubApi({ '/api/session': refusal(more), [`/api${LIST}`]: refusal(more) });
}

// Pending migrations until the run; then the state `after` describes, or a ready database when it is null.
export function serveRun(run: MigrationRun | { status?: number; body: unknown }, after: RefusalFields | null) {
  let ran = false;

  return stubApi({
    '/api/session': () => (ran && after === null ? { body: session } : refusal(ran ? (after ?? {}) : { missing: PENDING })),
    [`/api${LIST}`]: { body: page([]) },
    '/api/migrate': () => {
      ran = true;

      return 'outcome' in run ? { body: run } : run;
    },
  });
}

export function withToken() {
  beforeEach(() => {
    const meta = document.createElement('meta');
    meta.name = 'console-token';
    meta.content = 'the-token';
    document.head.append(meta);
  });
  afterEach(() => {
    document.head.querySelector('meta[name="console-token"]')?.remove();
  });
}

export async function update() {
  fireEvent.click(await screen.findByRole('button', { name: 'Update database' }));
}

export function crumb() {
  const crumbs = within(screen.getByRole('navigation', { name: 'Breadcrumb' }));

  return crumbs.getByText((_, el) => el?.getAttribute('aria-current') === 'page');
}

export function expectStateShell(container: HTMLElement) {
  expect(container.querySelector('main')?.className).toBe('page page-narrow');
  expect(screen.queryByRole('link', { name: /Review/ })).toBeNull();
  expect(container.querySelector('.nav-badge')).toBeNull();
}
