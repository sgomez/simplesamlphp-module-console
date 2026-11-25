import type { EntitiesPort, EntityPage } from '../../domain/entities';
import { getJson, postJson } from './client';
import { API, spListOf } from './paths';

export const httpEntities: EntitiesPort = {
  list: ({ q, page, filter }) => {
    const search = new URLSearchParams();
    if (q !== '') {
      search.set('q', q);
    }
    if (filter !== 'all') {
      search.set('filter', filter);
    }
    if (page !== null) {
      search.set('page', page);
    }

    return getJson<EntityPage>(spListOf(search));
  },
  remove: (entityId) => postJson<unknown>(API.spDelete, { entityid: entityId }),
};
