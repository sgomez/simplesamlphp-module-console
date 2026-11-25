import { createContext, useContext } from 'react';
import type { Result } from '../../lib/result';
import type { EntityPage, ListFilter } from './types';

export interface ListQuery {
  q: string;
  // As the URL has it; the server reads it.
  page: string | null;
  filter: ListFilter;
}

export interface EntitiesPort {
  list(query: ListQuery): Promise<Result<EntityPage>>;
  remove(entityId: string): Promise<Result<unknown>>;
}

const unset = async () => ({ ok: false, status: 0, body: null }) as const;

export const EntitiesPortContext = createContext<EntitiesPort>({ list: unset, remove: unset });

export function useEntitiesPort(): EntitiesPort {
  return useContext(EntitiesPortContext);
}
