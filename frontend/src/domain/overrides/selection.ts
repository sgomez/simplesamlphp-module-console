import type { EntitySet } from '../entities';
import { EXTERNAL, EXTERNAL_SETS } from './external';

export const IMPORT = `${EXTERNAL}/import`;

// What is ticked for an Import, per source of metadata.sources: the whole source or some entity IDs.
export interface Picked {
  position: number;
  all: boolean;
  entityIds: string[];
}

export interface ImportSelection {
  set: EntitySet;
  sources: Picked[];
}

// The ticked entities of the confirmation step, as the server lists them again (SPEC 9.5).
export interface ImportPreview {
  sources: { heading: string; location: string; entities: { entityId: string; name: string | null }[] }[];
}

// all=<source> for a whole source, id=<source>:<entity ID> for one entity.
export function importPath({ set, sources }: ImportSelection): string {
  const search = new URLSearchParams({ set });
  for (const { position, all, entityIds } of sources) {
    if (all) {
      search.append('all', String(position));
    }
    for (const entityId of all ? [] : entityIds) {
      search.append('id', `${position}:${entityId}`);
    }
  }

  return `${IMPORT}?${search}`;
}

export function selectionOf(search: URLSearchParams): ImportSelection {
  const set = EXTERNAL_SETS.find((name) => name === search.get('set')) ?? 'saml20-sp-remote';
  const by = new Map<number, Picked>();
  const at = (position: number): Picked => {
    const found = by.get(position) ?? { position, all: false, entityIds: [] };
    by.set(position, found);

    return found;
  };
  for (const position of search.getAll('all')) {
    at(Number(position)).all = true;
  }
  for (const value of search.getAll('id')) {
    const cut = value.indexOf(':');
    at(Number(value.slice(0, cut))).entityIds.push(value.slice(cut + 1));
  }

  return { set, sources: [...by.values()].sort((a, b) => a.position - b.position) };
}
