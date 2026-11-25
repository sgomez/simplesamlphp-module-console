import type { EntitiesPort, EntityPage } from '../../domain/entities';
import { getJson, postJson } from './client';
import { API, spListOf } from './paths';

// The server does not filter yet: it answers without counts, so the list shows no filter.
export const httpEntities: EntitiesPort = {
  list: ({ q, page }) => {
    const search = new URLSearchParams();
    if (q !== '') {
      search.set('q', q);
    }
    if (page !== null) {
      search.set('page', page);
    }

    return getJson<EntityPage>(spListOf(search));
  },
  remove: (entityId) => postJson<unknown>(API.spDelete, { entityid: entityId }),
};
