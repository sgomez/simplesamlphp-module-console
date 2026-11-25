import type { EntitySet } from '../entities';

export const EXTERNAL = '/external';

// The sets the External entities screen offers, as the External board does.
export const EXTERNAL_SETS: readonly EntitySet[] = ['saml20-sp-remote', 'saml20-idp-remote'];

export interface ExternalQuery {
  set: EntitySet;
  q: string;
  // The 0-based position in metadata.sources of the source that `page` pages.
  source: string | null;
  page: string | null;
}

type Wanted = Partial<ExternalQuery> & { set: EntitySet };

export function externalSearch({ set, q, source = null, page = null }: Wanted): URLSearchParams {
  const search = new URLSearchParams();
  for (const [key, value] of [['set', set], ['q', q], ['source', source], ['page', page]] as const) {
    if (value && !(key === 'set' && value === EXTERNAL_SETS[0])) {
      search.set(key, value);
    }
  }

  return search;
}

export function externalPath(wanted: Wanted): string {
  const search = externalSearch(wanted);

  return search.size > 0 ? `${EXTERNAL}?${search}` : EXTERNAL;
}

export function externalEntityPath(set: EntitySet, entityId: string): string {
  return `${EXTERNAL}/${set}?entityid=${encodeURIComponent(entityId)}`;
}

// SPEC 9.5: the editor of the set filled with one copy, unsaved.
export function externalCopyPath(set: EntitySet, entityId: string, position: number): string {
  return `${EXTERNAL}/${set}/copy?entityid=${encodeURIComponent(entityId)}&source=${position}`;
}

export interface ExternalRow {
  entityId: string;
  name: string | null;
  // Already a managed entity of the same set.
  managed: boolean;
  // The day it expired, if it has.
  expired: string | null;
}

// One entry of metadata.sources, as the server names it: "Federation feed", "metarefresh · https://…".
export interface ExternalSource {
  position: number;
  heading: string;
  location: string;
  // flatfile and pdo sources offer Import (SPEC 9.5).
  importable: boolean;
  // A source that throws is listed with its error and nothing else.
  error: string | null;
  total: number;
  page: number;
  pages: number;
  perPage: number;
  rows: ExternalRow[];
}

export interface ExternalPage {
  set: EntitySet;
  query: string;
  sources: ExternalSource[];
}

// One copy of an External entity, as core receives it, sensitive options masked.
export interface ExternalCopy {
  position: number;
  heading: string;
  location: string;
  served: boolean;
  php: string;
}

export interface ExternalEntity {
  set: EntitySet;
  entityId: string;
  name: string | null;
  copies: ExternalCopy[];
}
