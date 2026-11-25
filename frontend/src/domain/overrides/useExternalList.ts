import { useState } from 'react';
import { useSearchParams } from 'react-router';
import type { EntitySet } from '../entities';
import { useLoad, type Loaded } from '../session';
import { EXTERNAL_SETS, externalPath, externalSearch, type ExternalPage, type ExternalSource } from './external';
import { useOverridesPort } from './port';
import type { ImportSelection } from './selection';

// What is ticked in one source: all of it, or some entity IDs.
interface Ticked {
  all: boolean;
  ids: readonly string[];
}

export interface ExternalList {
  set: EntitySet;
  query: string;
  answer: Loaded<ExternalPage>;
  // Every ticked entity, across the pages of each source.
  count: number;
  selection: ImportSelection;
  ticked: (source: ExternalSource) => Ticked;
  tick: (source: ExternalSource, entityId: string, on: boolean) => void;
  tickAll: (source: ExternalSource, on: boolean) => void;
  clear: () => void;
  search: (query: string) => void;
  choose: (set: EntitySet) => void;
}

const NONE: Ticked = { all: false, ids: [] };

// SPEC 10.13: set, search and the page of a source live in the URL; nothing is ticked at first.
export function useExternalList(): ExternalList {
  const port = useOverridesPort();
  const [params, setParams] = useSearchParams();
  const set = EXTERNAL_SETS.find((name) => name === params.get('set')) ?? 'saml20-sp-remote';
  const query = params.get('q') ?? '';
  const source = params.get('source');
  const page = params.get('page');
  const answer = useLoad(externalPath({ set, q: query, source, page }), () => port.external({ set, q: query, source, page }));
  const [picks, setPicks] = useState<{ set: EntitySet; by: Record<number, Ticked> }>({ set, by: {} });
  const by = picks.set === set ? picks.by : {};
  const ticked = (at: ExternalSource) => by[at.position] ?? NONE;
  const pick = (at: ExternalSource, next: Ticked) => setPicks({ set, by: { ...by, [at.position]: next } });
  const sources = answer.state === 'ready' ? answer.data.sources : [];
  const count = sources.reduce((sum, at) => sum + (ticked(at).all ? at.total : ticked(at).ids.length), 0);
  const go = (next: { set: EntitySet; q: string }) => void setParams(externalSearch(next));

  const selection = {
    set,
    sources: Object.entries(by).map(([position, { all, ids }]) => ({ position: Number(position), all, entityIds: [...ids] })),
  };

  return {
    set,
    query,
    answer,
    count,
    selection,
    ticked,
    tick: (at, entityId, on) => {
      const { ids } = ticked(at);
      pick(at, { all: false, ids: on ? [...ids, entityId] : ids.filter((id) => id !== entityId) });
    },
    tickAll: (at, on) => pick(at, on ? { all: true, ids: [] } : NONE),
    clear: () => setPicks({ set, by: {} }),
    search: (q) => go({ set, q: q.trim() }),
    choose: (next) => go({ set: next, q: query }),
  };
}
