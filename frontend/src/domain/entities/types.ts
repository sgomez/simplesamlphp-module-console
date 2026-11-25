export interface EntityLabel {
  text: string;
  kind: 'disabled' | 'warning' | 'error';
  title: string | null;
}

export interface EntityRow {
  entityId: string;
  name: string | null;
  state: string | null;
  labels: EntityLabel[];
  unreadable: boolean;
  inSnapshot: boolean;
  error: string | null;
}

export type ListFilter = 'all' | 'not-live' | 'warnings';

export type ListCounts = Record<ListFilter, number>;

export interface EntityPage {
  rows: EntityRow[];
  total: number;
  page: number;
  pages: number;
  perPage: number;
  query: string;
  // The rows each filter matches, within the search.
  counts: ListCounts;
}

export interface EntityWarning {
  label: string;
  message: string;
}

export interface EntityNotice {
  message: string;
  option: string | null;
  line: number | null;
  // The cataloged option an unknown one is close to; the API does not send it yet.
  suggestion?: string;
}

export interface ExistingEntity {
  entityId: string;
  name: string | null;
}

export interface EntityError {
  pointer: string;
  message: string;
  line: number | null;
  column: number | null;
  // "Already exists" on a create: the entity it clashes with.
  existing?: ExistingEntity;
}

// The object of the edit screen; an Unreadable row has no text, only its stored bytes.
export interface EditedEntity {
  entityId: string;
  name: string | null;
  version: number;
  state: string | null;
  unreadable: boolean;
  inSnapshot: boolean;
  error: string | null;
  php: string | null;
  // The stored bytes of an Unreadable row.
  raw: string | null;
  // What the current schema rejects in the stored document.
  errors: EntityError[];
  warnings: EntityWarning[];
  notices: EntityNotice[];
  // Not served by the API yet: the enabled flag, and whether a next key waits to be promoted.
  enabled?: boolean;
  nextKey?: boolean;
}

export interface Refusal {
  errors: EntityError[];
  notices: EntityNotice[];
  readable: boolean;
}

export interface Validation extends Refusal {
  warnings: EntityWarning[];
}
