import { createContext, useContext } from 'react';
import type { Result } from '../../lib/result';
import type { EntitySet } from '../entities';

interface Named {
  set: EntitySet;
  entityId: string;
  name: string | null;
}

// One line of Needs attention (SPEC 10.7); the interface words it and links it to the place that deals with it.
export type Attention =
  | { kind: 'pending'; count: number }
  | { kind: 'node'; node: string; problem: 'behind'; by: number }
  | { kind: 'node'; node: string; problem: 'silent'; minutes: number }
  | { kind: 'node'; node: string; problem: 'flagged' }
  // days: until it expires; negative once it has.
  | ({ kind: 'certificate'; days: number } & Named)
  | ({ kind: 'override'; reviewed: boolean } & Named)
  // console:Snapshot is missing from the metadata.sources of the node serving the page.
  | { kind: 'unlisted' };

export interface PublishedSnapshot {
  number: number;
  createdAt: string;
  createdBy: string;
  comment: string | null;
}

export interface Overview {
  attention: Attention[];
  current: PublishedSnapshot | null;
  // Managed objects per set, and managed authsources.
  counts: Record<EntitySet | 'authsources', number>;
}

export interface OverviewPort {
  overview(): Promise<Result<Overview>>;
}

const unset = async () => ({ ok: false, status: 0, body: null }) as const;

export const OverviewPortContext = createContext<OverviewPort>({ overview: unset });

export function useOverviewPort(): OverviewPort {
  return useContext(OverviewPortContext);
}
