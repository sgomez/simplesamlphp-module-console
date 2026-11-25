import { createContext, useContext } from 'react';
import type { Failed, Result } from '../../lib/result';
import type { EditedEntity, EntityPage, ListFilter, Refusal, Validation } from './types';

export interface ListQuery {
  q: string;
  // As the URL has it; the server reads it.
  page: string | null;
  filter: ListFilter;
}

// A new object has no entity ID or version until it is saved.
export type Draft = { php: string } | { entityId: string; version: number; php: string };

// How pasted configuration is read (SPEC 9.6).
export type PastedFormat = 'xml' | 'php';

export interface SavedBy {
  identity: string;
  at: Date;
}

export type SaveResult =
  | { kind: 'saved'; entity: EditedEntity; tidied?: { comments: number } }
  | { kind: 'race'; entity: EditedEntity; by?: SavedBy }
  | { kind: 'invalid'; refusal: Refusal }
  | { kind: 'failed'; failed: Failed };

export interface EntitiesPort {
  list(query: ListQuery): Promise<Result<EntityPage>>;
  remove(entityId: string): Promise<Result<unknown>>;
  read(entityId: string): Promise<Result<EditedEntity>>;
  // The starter text of a new object.
  starter(): Promise<Result<EditedEntity>>;
  save(draft: Draft): Promise<SaveResult>;
  validate(entityId: string, php: string): Promise<Result<Validation>>;
  // The operations below are not served yet: without them their controls are hidden.
  setEnabled?(entityId: string, enabled: boolean): Promise<Result<EditedEntity>>;
  discard?(entityId: string): Promise<Result<EditedEntity>>;
  promote?(entityId: string): Promise<Result<EditedEntity>>;
  replacePath?(entityId: string): string;
  // Pasted configuration as the editor's text of a new object, unsaved.
  readPasted?: (text: string, format: PastedFormat) => Promise<Result<EditedEntity>>;
  // Stops the notice that a save tidied the text.
  hideTidied?(): void;
}

const unset = async () => ({ ok: false, status: 0, body: null }) as const;

export const EntitiesPortContext = createContext<EntitiesPort>({
  list: unset,
  remove: unset,
  read: unset,
  starter: unset,
  save: async () => ({ kind: 'failed', failed: { status: 0, body: null } }),
  validate: unset,
});

export function useEntitiesPort(): EntitiesPort {
  return useContext(EntitiesPortContext);
}
