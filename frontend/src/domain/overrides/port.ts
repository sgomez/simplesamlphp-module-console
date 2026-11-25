import { createContext, useContext } from 'react';
import type { Result } from '../../lib/result';
import { listRoute, type EntitySet } from '../entities';
import type { CreationReport } from '../pasted';
import type { ExternalEntity, ExternalPage, ExternalQuery } from './external';
import type { ImportPreview, ImportSelection } from './selection';

export function overridePath(entityId: string, set: EntitySet = 'saml20-sp-remote'): string {
  return `${listRoute(set)}/override?entityid=${encodeURIComponent(entityId)}`;
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

// SPEC 9.1 to 9.4: External entities, read live from the node's metadata.sources, and the Overrides of them.
export interface OverridesPort {
  external(query: ExternalQuery): Promise<Result<ExternalPage>>;
  externalEntity(set: EntitySet, entityId: string): Promise<Result<ExternalEntity>>;
  compare(entityId: string): Promise<Result<OverrideComparison>>;
  markReviewed(entityId: string): Promise<Result<unknown>>;
  // SPEC 9.5: the confirmation step reads the ticked entities again; Import saves them.
  importPreview(selection: ImportSelection): Promise<Result<ImportPreview>>;
  runImport(selection: ImportSelection): Promise<Result<CreationReport>>;
}

const unset = async () => ({ ok: false, status: 0, body: null }) as const;

export const OverridesPortContext = createContext<OverridesPort>({
  external: unset,
  externalEntity: unset,
  compare: unset,
  markReviewed: unset,
  importPreview: unset,
  runImport: unset,
});

export function useOverridesPort(): OverridesPort {
  return useContext(OverridesPortContext);
}
