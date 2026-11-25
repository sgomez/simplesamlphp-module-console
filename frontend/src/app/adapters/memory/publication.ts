import type { NodeStatus, PublicationPort, PublicationReview, PublishResult } from '../../../domain/publication';
import type { Failed } from '../../../lib/result';
import { boardGroups, boardNodes } from './changes';

export interface MemoryPublication {
  review?: PublicationReview;
  // What the confirming request answers; a Publication of the next number by default.
  answer?: PublishResult;
  failure?: Failed;
  // The review never answers.
  pending?: boolean;
  // false: only what the API serves today, as the HTTP adapter.
  full?: boolean;
  nodes?: NodeStatus[];
}

export const boardReview: PublicationReview = {
  groups: boardGroups,
  problems: [],
  warnings: [
    { entityId: 'https://moodle.example.edu/shibboleth', name: 'Moodle', message: 'the signing certificate expires in 12 days.' },
    { entityId: 'default-sp', name: 'default-sp', message: 'signature.algorithm uses SHA-1, which many IdPs reject.' },
  ],
  hash: 'board',
  nextNumber: 42,
  current: { number: 41, createdAt: '2026-11-20 10:15:00' },
  canPublish: true,
};

function emptied(review: PublicationReview, number = review.current?.number): PublicationReview {
  return {
    ...review,
    groups: [],
    problems: [],
    warnings: [],
    canPublish: false,
    ...(number === undefined ? {} : { current: { number, createdAt: null }, nextNumber: number + 1 }),
  };
}

export function memoryPublication(options: MemoryPublication = {}): PublicationPort {
  const { review = boardReview, answer, failure, pending, full = true, nodes = boardNodes } = options;
  let stored = review;
  const port: PublicationPort = {
    review: async () => {
      if (pending) {
        return new Promise(() => undefined);
      }

      return failure ? { ok: false, ...failure } : { ok: true, data: stored };
    },
    publish: async () => {
      const result = answer ?? { kind: 'published', published: { number: stored.nextNumber, build: null } };
      if (result.kind === 'published') {
        stored = emptied(stored, result.published.number);
      } else if (result.kind === 'moved') {
        stored = result.moved.review;
      }

      return result;
    },
  };
  if (!full) {
    return port;
  }

  return {
    ...port,
    discard: async (entityId) => {
      const groups = stored.groups.map((group) => ({ ...group, changes: group.changes.filter((c) => c.entityId !== entityId) }));
      stored = { ...stored, groups: groups.filter((group) => group.changes.length > 0) };

      return { ok: true, data: {} };
    },
    discardAll: async () => {
      stored = emptied(stored);

      return { ok: true, data: {} };
    },
    nodes: async () => ({ ok: true, data: nodes }),
  };
}
