import { createContext, useContext } from 'react';
import type { Result } from '../../lib/result';
import { SP_LIST } from '../entities';

export function overridePath(entityId: string): string {
  return `${SP_LIST}/override?entityid=${encodeURIComponent(entityId)}`;
}

// One option of the Override against its External entity; null where one side does not set it.
export interface ComparedOption {
  option: string;
  managed: string | null;
  source: string | null;
  // The source changed it since the Override was last reviewed.
  changedInSource: boolean;
}

// SPEC 9.4 and 10.13; changedOn is null for an Override never reviewed.
export interface OverrideComparison {
  entityId: string;
  name: string | null;
  changedOn: string | null;
  options: ComparedOption[];
}

export interface OverridesPort {
  compare(entityId: string): Promise<Result<OverrideComparison>>;
  markReviewed(entityId: string): Promise<Result<unknown>>;
}

const unset = async () => ({ ok: false, status: 0, body: null }) as const;

export const OverridesPortContext = createContext<OverridesPort>({ compare: unset, markReviewed: unset });

export function useOverridesPort(): OverridesPort {
  return useContext(OverridesPortContext);
}
