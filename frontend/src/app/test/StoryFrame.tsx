import type { ReactNode } from 'react';
import { EntitiesPortContext, type EntitiesPort } from '../../domain/entities';
import { SessionPortContext, type Counts, type SessionPort } from '../../domain/session';
import { boardCounts, boardLinks, memorySession } from '../adapters/memory/session';
import { Shell, type Crumb } from '../Shell';

interface StoryFrameProps {
  crumbs: readonly Crumb[];
  pending?: number;
  entities: EntitiesPort;
  session?: SessionPort;
  counts?: Counts;
  end?: ReactNode;
  children: ReactNode;
}

// A page story inside the Console's chrome, over in-memory ports.
export function StoryFrame({ crumbs, pending = 0, entities, session = memorySession, counts = boardCounts, end, children }: StoryFrameProps) {
  return (
    <SessionPortContext value={session}>
      <Shell session={boardLinks} pending={pending} counts={counts} crumbs={crumbs} {...(end === undefined ? {} : { end })}>
        <EntitiesPortContext value={entities}>{children}</EntitiesPortContext>
      </Shell>
    </SessionPortContext>
  );
}
