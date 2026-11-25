import type { PublicationReview } from '../domain/publication';

export function changeCount(review: PublicationReview): number {
  return review.groups.reduce((sum, group) => sum + group.changes.length, 0);
}
