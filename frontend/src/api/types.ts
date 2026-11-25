export interface CurrentSnapshot {
  number: number;
  createdAt: string | null;
}

export interface SessionLinks {
  identity: string;
  adminUrl: string;
  logoutUrl: string;
}

export interface Session extends SessionLinks {
  pendingCount: number;
  current: CurrentSnapshot | null;
}

export type ChangeState = 'Unpublished' | 'Modified' | 'Deleted' | 'Unreadable';

// opens: false for Deleted and Unreadable, which have no edit screen to open.
export interface PendingChange {
  entityId: string;
  loadError: string | null;
  opens: boolean;
}

export interface ChangeGroup {
  state: ChangeState;
  changes: PendingChange[];
}

export interface PublicationProblem {
  entityId: string | null;
  message: string;
}

export interface PublicationReview {
  groups: ChangeGroup[];
  problems: PublicationProblem[];
  warnings: PublicationProblem[];
  hash: string;
  nextNumber: number;
  current: CurrentSnapshot | null;
  canPublish: boolean;
}

export interface Published {
  number: number;
  build: string | null;
}

// The 409 of a confirming request: the Pending changes moved, or a new problem blocks them.
export type PublicationRefused =
  | { code: 'moved'; review: PublicationReview }
  | { code: 'blocked'; problems: PublicationProblem[]; review: PublicationReview };

export interface Migration {
  number: number;
  title: string;
}

// The 503 of every API route while the database is not ready.
export interface DatabaseRefusal {
  state: 'Unreachable' | 'SqliteTooOld' | 'ConsoleOlder' | 'MigrationsPending';
  known: number;
  highest: number;
  missing: Migration[];
  sqliteVersion: string | null;
  sqliteMinimum: string;
  detail: string | null;
  session: SessionLinks;
}

export interface MigrationRun {
  outcome: 'Applied' | 'Concurrent' | 'Failed';
  applied: number[];
  failed: Migration | null;
  reason: string | null;
}

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
  error: string | null;
}

export interface EntityPage {
  rows: EntityRow[];
  total: number;
  page: number;
  pages: number;
  perPage: number;
  query: string;
}

export interface EntityWarning {
  label: string;
  message: string;
}

export interface EntityNotice {
  message: string;
  option: string | null;
  line: number | null;
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
  error: string | null;
  php: string | null;
  // The stored bytes of an Unreadable row.
  raw: string | null;
  // What the current schema rejects in the stored document.
  errors: EntityError[];
  warnings: EntityWarning[];
  notices: EntityNotice[];
}

export interface Refusal {
  errors: EntityError[];
  notices: EntityNotice[];
  readable: boolean;
}

export interface Validation extends Refusal {
  warnings: EntityWarning[];
}
