import { createContext, useContext } from 'react';
import type { Result } from '../../lib/result';

export const NODES = '/nodes';

// A row of the Node table (SPEC 4.4).
export interface NodeRow {
  identifier: string;
  served: number | null;
  checkedAt: string;
  hasProblems: boolean;
  // The node serving the page.
  here: boolean;
}

// Text with the parts that name a file or a path set in code.
export type Detail = readonly (string | { code: string })[];

// A problem of the node serving the page, read from its disk (SPEC 3.5).
export interface NodeProblem {
  title: string;
  detail: Detail;
  // Lines to add to a file, such as the authsources.php fragment.
  fix: string | null;
}

export interface NodeList {
  nodes: NodeRow[];
  current: number | null;
  // The server's clock, which the last checks are measured against.
  now: string;
  problems: NodeProblem[];
}

export interface NodesPort {
  nodes(): Promise<Result<NodeList>>;
}

const unset = async () => ({ ok: false, status: 0, body: null }) as const;

export const NodesPortContext = createContext<NodesPort>({ nodes: unset });

export function useNodesPort(): NodesPort {
  return useContext(NodesPortContext);
}
