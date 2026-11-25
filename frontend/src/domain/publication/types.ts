import type { DiffLine } from '../../design-system/Diff';
import type { CurrentSnapshot } from '../session';

// The states of section 8.2 a Pending change can be in; the API serves no "To be withdrawn" yet.
export type ChangeState = 'Modified' | 'Unpublished' | 'To be withdrawn' | 'Deleted' | 'Unreadable';

// opens: false for Deleted and Unreadable, which have no edit screen to open.
// kind, summary and diff: not served by the API yet.
export interface PendingChange {
  entityId: string;
  name: string | null;
  loadError: string | null;
  opens: boolean;
  kind?: string;
  summary?: string;
  diff?: DiffLine[];
}

export interface ChangeGroup {
  state: ChangeState;
  changes: PendingChange[];
}

export interface PublicationProblem {
  entityId: string | null;
  name: string | null;
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

// The current review after a move; last: the object saved last and when, not served by the API yet.
export interface Moved {
  review: PublicationReview;
  last?: { name: string; when: string };
}

export interface NodeStatus {
  id: string;
  // The node serving the page.
  here: boolean;
  serves: number;
  // Its last check, as a phrase: "8 s ago".
  checked: string;
}
