import type { EntitySet } from '../domain/entities';
import { externalPath } from '../domain/overrides';
import { AddFromPaste, HeldReview, HeldSeveral } from '../domain/pasted';

export function AddFromPastePage({ set }: { set: EntitySet }) {
  return <AddFromPaste set={set} external={externalPath({ set })} />;
}

export function PastedReviewPage({ set }: { set: EntitySet }) {
  return <HeldReview set={set} />;
}

export function AddSeveralPage({ set }: { set: EntitySet }) {
  return <HeldSeveral set={set} />;
}
