import { createContext, useContext } from 'react';
import type { DiffLine } from '../../design-system/Diff';
import type { Result } from '../../lib/result';

export const HISTORY = '/history';
export const AUDIT = '/history/audit';

export function rollbackPath(number: number): string {
  return `${HISTORY}/${number}/rollback`;
}

export interface RetainedSnapshot {
  number: number;
  createdAt: string;
  createdBy: string;
  comment: string | null;
  changes: number;
}

// SPEC 10.15: the retained Snapshots, newest first, and how many the database keeps.
export interface SnapshotList {
  snapshots: RetainedSnapshot[];
  current: number | null;
  retention: number;
}

// One object whose PHP text differs between the current Snapshot and the target.
export interface RollbackObject {
  name: string;
  kind: string;
  // What happens to it on the nodes, when it is not just changed.
  fate: 'removed' | 'added' | null;
  lines: DiffLine[];
}

export interface RollbackPlan {
  target: number;
  current: number;
  objects: RollbackObject[];
  // The objects that change and are not listed.
  more: number;
  // Modules of the target's authsources that the node serving the page lacks (SPEC 8.5).
  missingModules: string[];
  // A target that fails its checks offers no Rollback.
  broken: 'checksum' | 'format' | null;
}

export interface HistoryPort {
  snapshots(): Promise<Result<SnapshotList>>;
  plan(target: number): Promise<Result<RollbackPlan>>;
  // 409: the current Snapshot moved meanwhile.
  rollBack(target: number, from: number): Promise<Result<unknown>>;
}

const unset = async () => ({ ok: false, status: 0, body: null }) as const;

export const HistoryPortContext = createContext<HistoryPort>({ snapshots: unset, plan: unset, rollBack: unset });

export function useHistoryPort(): HistoryPort {
  return useContext(HistoryPortContext);
}
