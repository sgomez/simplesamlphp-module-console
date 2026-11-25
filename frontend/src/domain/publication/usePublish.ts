import { useState } from 'react';
import { useLoad, useSettle } from '../session';
import { changeCount } from './counts';
import { usePublicationPort } from './port';
import type { Moved, NodeStatus, PublicationReview, Published } from './types';

// What the last confirming request came to; null before any.
export type Outcome =
  | { kind: 'published'; published: Published; count: number }
  | { kind: 'failed'; lead: string; status: number }
  | null;

export interface Publish {
  // null while the review loads or when it could not be read.
  review: PublicationReview | null;
  moved: Moved | null;
  outcome: Outcome;
  // null: the API does not serve the Node table yet.
  nodes: NodeStatus[] | null;
  comment: string;
  sending: boolean;
  setComment: (comment: string) => void;
  publish: () => void;
  // Another request changed the Pending changes: ask for the review again.
  reload: () => void;
  fail: (lead: string, status: number) => void;
}

const none = async () => ({ ok: true, data: null }) as const;

export function usePublish(onChange: () => void): Publish {
  const port = usePublicationPort();
  const settle = useSettle();
  const [revision, setRevision] = useState(0);
  const answer = useLoad('publication', () => port.review(), { revision });
  const nodes = useLoad<NodeStatus[] | null>(port.nodes ? 'nodes' : 'no nodes', port.nodes ?? none, { revision });
  const [moved, setMoved] = useState<Moved | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const review = moved?.review ?? (answer.state === 'ready' ? answer.data : null);
  const fail = (lead: string, status: number) => setOutcome({ kind: 'failed', lead, status });

  const publish = async (shown: PublicationReview) => {
    setSending(true);
    const result = await port.publish(shown.hash, comment);
    setSending(false);
    if (result.kind === 'failed') {
      settle(result.failed, (status) => fail('Not published', status));

      return;
    }
    if (result.kind === 'published') {
      setOutcome({ kind: 'published', published: result.published, count: changeCount(shown) });
      setRevision((n) => n + 1);
    } else {
      setOutcome(null);
      setMoved(result.moved);
    }
    onChange();
  };

  return {
    review,
    moved,
    outcome,
    nodes: nodes.state === 'ready' ? nodes.data : null,
    comment,
    sending,
    setComment,
    publish: () => {
      if (review !== null) {
        void publish(review);
      }
    },
    reload: () => {
      setMoved(null);
      setOutcome(null);
      setRevision((n) => n + 1);
      onChange();
    },
    fail,
  };
}
