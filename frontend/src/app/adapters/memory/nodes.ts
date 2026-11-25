import type { NodeList, NodesPort } from '../../../domain/nodes';
import type { Failed } from '../../../lib/result';

const NOW = '2026-11-25T12:00:00.000Z';

function before(seconds: number): string {
  return new Date(Date.parse(NOW) - seconds * 1000).toISOString();
}

// The Nodes board.
export const boardNodes: NodeList = {
  current: 41,
  now: NOW,
  nodes: [
    { identifier: 'web-03', served: 39, checkedAt: before(3 * 3600), hasProblems: false, here: false },
    { identifier: 'web-01', served: 41, checkedAt: before(20), hasProblems: true, here: true },
    { identifier: 'web-02', served: 41, checkedAt: before(41), hasProblems: false, here: false },
  ],
  problems: [
    {
      title: 'Partner hospital is left out',
      detail: ['Key file ', { code: 'hospital-sp.pem' }, ' not found in ', { code: '/var/simplesamlphp/cert' }],
      fix: null,
    },
    {
      title: 'A configuration fragment is missing',
      detail: [],
      fix: "// config/authsources.php\nrequire __DIR__ . '/../modules/console/config/authsources.inc.php';",
    },
  ],
};

// The NodesSingle board.
export const singleNode: NodeList = {
  current: 41,
  now: NOW,
  nodes: [{ identifier: 'login-01', served: 41, checkedAt: before(12), hasProblems: false, here: true }],
  problems: [],
};

export function nodeAgo(seconds: number): string {
  return before(seconds);
}

export function memoryNodes({ list = boardNodes, failure }: { list?: NodeList; failure?: Failed } = {}): NodesPort {
  return { nodes: async () => (failure ? { ok: false, ...failure } : { ok: true, data: list }) };
}
