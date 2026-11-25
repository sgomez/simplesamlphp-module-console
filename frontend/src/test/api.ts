import { vi } from 'vitest';
import type { DatabaseRefusal, EntityPage, EntityRow, Session } from '../api/types';

type Answer = { status?: number; body: unknown };

export function stubApi(answers: Record<string, Answer | ((url: URL, init?: RequestInit) => Answer)>) {
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost');
    const key = url.pathname + url.search;
    const entry = answers[key] ?? answers[url.pathname];
    const answer = typeof entry === 'function' ? entry(url, init) : entry;
    if (answer === undefined) {
      throw new Error(`Unexpected request ${key}`);
    }

    return new Response(JSON.stringify(answer.body), {
      status: answer.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetch);

  return fetch;
}

export const session: Session = {
  identity: 'admin',
  adminUrl: 'http://localhost/simplesaml/module.php/admin/',
  logoutUrl: 'http://localhost/simplesaml/module.php/core/logout/admin',
  pendingCount: 0,
};

export function sp(entityId: string, more: Partial<EntityRow> = {}): EntityRow {
  return { entityId, name: null, state: 'Up to date', labels: [], unreadable: false, error: null, ...more };
}

export function page(rows: EntityRow[], more: Partial<EntityPage> = {}): EntityPage {
  return { rows, total: rows.length, page: 1, pages: 1, perPage: 25, query: '', ...more };
}

export function refusal(more: Partial<DatabaseRefusal> = {}): Answer {
  const body: DatabaseRefusal = {
    state: 'MigrationsPending',
    known: 9,
    highest: 0,
    missing: [],
    sqliteVersion: null,
    sqliteMinimum: '3.24.0',
    detail: null,
    session: { identity: session.identity, adminUrl: session.adminUrl, logoutUrl: session.logoutUrl },
    ...more,
  };

  return { status: 503, body };
}
