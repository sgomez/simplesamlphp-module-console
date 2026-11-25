import type { CurrentSnapshot } from '../session';

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
