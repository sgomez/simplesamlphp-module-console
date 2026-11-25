import type { PublicationReview } from '../api/types';

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function changeCount(review: PublicationReview): number {
  return review.groups.reduce((sum, group) => sum + group.changes.length, 0);
}
