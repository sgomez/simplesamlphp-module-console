import type { EntitiesPort, EntityPage, EntityRow, ListCounts, ListFilter } from '../../../domain/entities';
import type { Failed } from '../../../lib/result';
import { memoryEditing, type MemoryEditing } from './editing';

export interface MemoryEntities extends MemoryEditing {
  rows?: EntityRow[];
  perPage?: number;
  // The board's counts, in place of the ones the rows give.
  counts?: ListCounts;
  failure?: Failed;
  // The list never answers.
  pending?: boolean;
  // What a delete answers in place of success; 'pending' never answers.
  removal?: Failed | 'pending';
}

const MATCHES: Record<ListFilter, (row: EntityRow) => boolean> = {
  all: () => true,
  'not-live': (row) => row.state === 'Unpublished' || row.labels.some((label) => label.kind === 'disabled'),
  warnings: (row) => row.labels.some((label) => label.kind === 'warning'),
};

function searched(rows: EntityRow[], q: string): EntityRow[] {
  const needle = q.toLowerCase();

  return rows.filter((row) => row.entityId.toLowerCase().includes(needle) || (row.name ?? '').toLowerCase().includes(needle));
}

export function memoryEntities({ rows = [], perPage = 12, counts, failure, pending, removal, ...editing }: MemoryEntities = {}): EntitiesPort {
  let stored = [...rows];

  return {
    ...memoryEditing(editing),
    list: async ({ q, page, filter }) => {
      if (pending) {
        return new Promise(() => undefined);
      }
      if (failure) {
        return { ok: false, ...failure };
      }
      const found = searched(stored, q);
      const matching = found.filter(MATCHES[filter]);
      const pages = Math.ceil(matching.length / perPage);
      const at = Math.min(Math.max(Number(page ?? 1) || 1, 1), Math.max(pages, 1));
      const data: EntityPage = {
        rows: matching.slice((at - 1) * perPage, at * perPage),
        total: matching.length,
        page: at,
        pages,
        perPage,
        query: q,
        counts: counts ?? {
          all: found.length,
          'not-live': found.filter(MATCHES['not-live']).length,
          warnings: found.filter(MATCHES.warnings).length,
        },
      };

      return { ok: true, data };
    },
    remove: async (entityId) => {
      if (removal === 'pending') {
        return new Promise(() => undefined);
      }
      if (removal) {
        return { ok: false, ...removal };
      }
      stored = stored.filter((row) => row.entityId !== entityId);

      return { ok: true, data: {} };
    },
  };
}
