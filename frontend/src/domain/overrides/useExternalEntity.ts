import { useParams, useSearchParams } from 'react-router';
import type { EntitySet } from '../entities';
import { useLoad, type Loaded } from '../session';
import type { ExternalEntity } from './external';
import { useOverridesPort } from './port';

export interface ExternalDetail {
  entityId: string;
  answer: Loaded<ExternalEntity>;
}

// SPEC 10.4: /external/{set}?entityid=…; a missing entity is the Console's 404.
export function useExternalEntity(): ExternalDetail {
  const port = useOverridesPort();
  const set = (useParams()['set'] ?? '') as EntitySet;
  const entityId = useSearchParams()[0].get('entityid') ?? '';
  const answer = useLoad(`external/${set}/${entityId}`, () => port.externalEntity(set, entityId), { entityId });

  return { entityId, answer };
}
