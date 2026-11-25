import { createContext, useContext } from 'react';
import type { Result } from '../../lib/result';
import { listRoute, type EntitySet } from '../entities';
import type { CreationReport, PastedFormat, PastedObject, Reading, Target } from './types';

export const AUTHSOURCE_REVIEW = '/authsources/new/review';

export function addPath(set: EntitySet, step: '' | '/review' | '/several' = ''): string {
  return `${listRoute(set)}/new${step}`;
}

export function replacePath(set: EntitySet, entityId: string, step: '' | '/review' = ''): string {
  return `${listRoute(set)}/replace${step}?entityid=${encodeURIComponent(entityId)}`;
}

// SPEC 9.5 to 9.7. Nothing here saves but createSeveral and createAuthsource; entities are saved as any edit is.
export interface PastedPort {
  // With an entity ID, only that entity of several.
  read(target: Target, text: string, format: PastedFormat, entityId?: string): Promise<Result<Reading>>;
  // The copy of an External entity held by the source at that position of metadata.sources.
  copy(set: EntitySet, entityId: string, source: number): Promise<Result<PastedObject>>;
  createSeveral(set: EntitySet, text: string, format: PastedFormat, entityIds: string[]): Promise<Result<CreationReport>>;
  replace(set: EntitySet, entityId: string, xml: string): Promise<Result<Reading>>;
  createAuthsource(php: string): Promise<Result<{ id: string }>>;
}

const unset = async () => ({ ok: false, status: 0, body: null }) as const;

export const PastedPortContext = createContext<PastedPort>({
  read: unset,
  copy: unset,
  createSeveral: unset,
  replace: unset,
  createAuthsource: unset,
});

export function usePastedPort(): PastedPort {
  return useContext(PastedPortContext);
}
