import type { SessionLinks } from '../database';

export interface CurrentSnapshot {
  number: number;
  createdAt: string | null;
}

export interface Session extends SessionLinks {
  pendingCount: number;
  current: CurrentSnapshot | null;
}
