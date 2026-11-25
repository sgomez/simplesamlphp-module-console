import { vi } from 'vitest';
import type {
  DatabaseRefusal,
  EditedEntity,
  EntityPage,
  EntityRow,
  PublicationReview,
  Refusal,
  Session,
  Validation,
} from '../api/types';

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
  current: null,
};

export function sp(entityId: string, more: Partial<EntityRow> = {}): EntityRow {
  return { entityId, name: null, state: 'Up to date', labels: [], unreadable: false, error: null, ...more };
}

export function review(more: Partial<PublicationReview> = {}): PublicationReview {
  return {
    groups: [],
    problems: [],
    warnings: [],
    hash: 'h1',
    nextNumber: 1,
    current: null,
    canPublish: false,
    ...more,
  };
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

export const EDIT = '/entities/saml20-sp-remote/edit?entityid=https%3A%2F%2Fsp.example.org';
export const ENTITY = '/api/entities/saml20-sp-remote/entity';
export const SAVE = '/api/entities/saml20-sp-remote/save';
export const VALIDATE = '/api/entities/saml20-sp-remote/validate';
export const PHP = "$metadata['https://sp.example.org'] = [\n    'name' => 'Example',\n];";

export function entity(more: Partial<EditedEntity> = {}): EditedEntity {
  return {
    entityId: 'https://sp.example.org',
    name: 'Example',
    version: 1,
    state: 'Unpublished',
    unreadable: false,
    error: null,
    php: PHP,
    warnings: [],
    notices: [],
    ...more,
  };
}

export function saveRefusal(more: Partial<Refusal> = {}): Refusal {
  return { errors: [], notices: [], readable: true, ...more };
}

export function validation(more: Partial<Validation> = {}): Validation {
  return { ...saveRefusal(), warnings: [], ...more };
}

// The body of the n-th POST to a path.
export function posted(fetch: ReturnType<typeof stubApi>, path: string, n = 0): unknown {
  const calls = fetch.mock.calls.filter(([input]) => String(input) === path);
  const init = calls[n]?.[1];

  return init?.body === undefined ? undefined : JSON.parse(String(init.body));
}
