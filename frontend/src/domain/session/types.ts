import type { SessionLinks } from '../database';
import type { Counts } from './navigation';

export interface CurrentSnapshot {
  number: number;
  createdAt: string | null;
}

export interface Session extends SessionLinks {
  pendingCount: number;
  current: CurrentSnapshot | null;
  counts: Counts;
}
