import type { PublicationPort, PublicationRefused, PublicationReview, Published } from '../../domain/publication';
import { getJson, postJson } from './client';
import { API } from './paths';

export const httpPublication: PublicationPort = {
  review: () => getJson<PublicationReview>(API.publication),
  publish: async (hash, comment) => {
    const result = await postJson<Published>(API.publication, { hash, comment });
    if (result.ok) {
      return { kind: 'published', published: result.data };
    }
    // A 409, moved or blocked, means the Pending changes or their problems changed (SPEC 10.14): the current review.
    const refused = result.body as Partial<PublicationRefused> | null;

    return result.status === 409 && refused?.review !== undefined
      ? { kind: 'moved', moved: { review: refused.review } }
      : { kind: 'failed', failed: { status: result.status, body: result.body } };
  },
};
