import { useSearchParams } from 'react-router';
import { useLoad, type Loaded } from '../session';
import { useEntitiesPort } from './port';
import { listPath, listSearch } from './routes';
import type { EntitySet } from './sets';
import type { EntityPage, ListFilter } from './types';

const FILTERS: readonly ListFilter[] = ['all', 'not-live', 'warnings'];

export interface EntityList {
  set: EntitySet;
  query: string;
  filter: ListFilter;
  answer: Loaded<EntityPage>;
  // No object at all, as opposed to none matching a search or a filter.
  empty: boolean;
  search: (query: string) => void;
}

// The search, the filter and the page live in the URL, so a list can be linked and reloaded.
export function useEntityList(set: EntitySet): EntityList {
  const port = useEntitiesPort();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const filter = FILTERS.find((name) => name === params.get('filter')) ?? 'all';
  const page = params.get('page');
  const key = `${listPath(set, query, filter)}#${page ?? ''}`;
  const answer = useLoad(key, () => port.list({ q: query, page, filter }));
  const empty = answer.state === 'ready' && answer.data.total === 0 && answer.data.query === '' && filter === 'all';

  return {
    set,
    query,
    filter,
    answer,
    empty,
    search: (q: string) => void setParams(listSearch(q.trim(), filter)),
  };
}
