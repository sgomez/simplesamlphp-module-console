import type { EditedEntity, EntitiesPort, EntityPage, Refusal, SaveResult, Validation } from '../../domain/entities';
import { getJson, postJson } from './client';
import { API, spEntityOf, spListOf } from './paths';

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
  read: (entityId) => getJson<EditedEntity>(spEntityOf(entityId)),
  starter: () => getJson<EditedEntity>(API.spEntity),
  save: async (draft): Promise<SaveResult> => {
    const body = 'entityId' in draft ? { entityid: draft.entityId, version: draft.version, php: draft.php } : { php: draft.php };
    const result = await postJson<EditedEntity>(API.spSave, body);
    if (result.ok) {
      return { kind: 'saved', entity: result.data };
    }
    if (result.status === 409) {
      return { kind: 'race', entity: result.body as EditedEntity };
    }
    if (result.status === 422) {
      return { kind: 'invalid', refusal: result.body as Refusal };
    }

    return { kind: 'failed', failed: result };
  },
  validate: (entityId, php) => postJson<Validation>(API.spValidate, { entityid: entityId, php }),
};
