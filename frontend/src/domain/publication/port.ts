import { createContext, useContext } from 'react';
import type { Failed, Result } from '../../lib/result';
import type { Moved, NodeStatus, PublicationReview, Published } from './types';

export type PublishResult =
  | { kind: 'published'; published: Published }
  | { kind: 'moved'; moved: Moved }
  | { kind: 'failed'; failed: Failed };

// discard, discardAll and nodes: absent while the API does not serve them, and so are their controls.
export interface PublicationPort {
  review(): Promise<Result<PublicationReview>>;
  publish(hash: string, comment: string): Promise<PublishResult>;
  discard?: (entityId: string) => Promise<Result<unknown>>;
  discardAll?: (hash: string) => Promise<Result<unknown>>;
  nodes?: () => Promise<Result<NodeStatus[]>>;
}

const failed = { ok: false, status: 0, body: null } as const;

export const PublicationPortContext = createContext<PublicationPort>({
  review: async () => failed,
  publish: async () => ({ kind: 'failed', failed }),
});

export function usePublicationPort(): PublicationPort {
  return useContext(PublicationPortContext);
}
