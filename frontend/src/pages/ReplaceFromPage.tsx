import type { EntitySet } from '../domain/entities';
import { HeldReplacement, ReplacePaste } from '../domain/pasted';

export function ReplaceFromPage({ set }: { set: EntitySet }) {
  return <ReplacePaste set={set} />;
}

export function ReplaceReviewPage({ set }: { set: EntitySet }) {
  return <HeldReplacement set={set} />;
}
