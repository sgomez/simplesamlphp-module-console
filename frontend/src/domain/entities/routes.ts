import type { EntitySet } from './sets';
import type { ListFilter } from './types';

const SP: EntitySet = 'saml20-sp-remote';

export function listRoute(set: EntitySet): string {
  return `/entities/${set}`;
}

export function newRoute(set: EntitySet): string {
  return `${listRoute(set)}/new`;
}

export const SP_LIST = listRoute(SP);
export const SP_EDIT = `${SP_LIST}/edit`;
export const SP_NEW = newRoute(SP);

export function editPath(entityId: string, set: EntitySet = SP): string {
  return `${listRoute(set)}/edit?entityid=${encodeURIComponent(entityId)}`;
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

export function listPath(set: EntitySet, query: string, filter: ListFilter, page?: number): string {
  const search = listSearch(query, filter, page);

  return search.size > 0 ? `${listRoute(set)}?${search}` : listRoute(set);
}
