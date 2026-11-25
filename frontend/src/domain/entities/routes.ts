import type { ListFilter } from './types';

export const SP_LIST = '/entities/saml20-sp-remote';
export const SP_EDIT = `${SP_LIST}/edit`;
export const SP_NEW = `${SP_LIST}/new`;

export function editPath(entityId: string): string {
  return `${SP_EDIT}?entityid=${encodeURIComponent(entityId)}`;
}

export function listSearch(query: string, filter: ListFilter, page?: number): URLSearchParams {
  const search = new URLSearchParams();
  if (query !== '') {
    search.set('q', query);
  }
  if (filter !== 'all') {
    search.set('filter', filter);
  }
  if (page !== undefined) {
    search.set('page', String(page));
  }

  return search;
}

export function listPath(query: string, filter: ListFilter, page?: number): string {
  const search = listSearch(query, filter, page);

  return search.size > 0 ? `${SP_LIST}?${search}` : SP_LIST;
}
