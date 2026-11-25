import type { ReactNode } from 'react';
import { DatabasePortContext, type DatabasePort } from '../../domain/database';
import { EntitiesPortContext, type EntitiesPort } from '../../domain/entities';
import { PublicationPortContext, type PublicationPort } from '../../domain/publication';
import { SessionPortContext, type Counts, type SessionPort } from '../../domain/session';
import { memoryDatabase } from '../adapters/memory/database';
import { memoryEntities } from '../adapters/memory/entities';
import { memoryPublication } from '../adapters/memory/publication';
import { boardCounts, boardLinks, memorySession } from '../adapters/memory/session';
import { Shell, type Crumb } from '../Shell';

interface StoryFrameProps {
  crumbs: readonly Crumb[];
  pending?: number;
  entities?: EntitiesPort;
  database?: DatabasePort;
  publication?: PublicationPort;
  session?: SessionPort;
  counts?: Counts;
  end?: ReactNode;
  children: ReactNode;
}

// A page story inside the Console's chrome, over in-memory ports.
export function StoryFrame({
  crumbs,
  pending = 0,
  entities = memoryEntities(),
  database = memoryDatabase(),
  publication = memoryPublication(),
  session = memorySession,
  counts = boardCounts,
  end,
  children,
}: StoryFrameProps) {
  return (
    <SessionPortContext value={session}>
      <Shell session={boardLinks} pending={pending} counts={counts} crumbs={crumbs} {...(end === undefined ? {} : { end })}>
        <DatabasePortContext value={database}>
          <EntitiesPortContext value={entities}>
            <PublicationPortContext value={publication}>{children}</PublicationPortContext>
          </EntitiesPortContext>
        </DatabasePortContext>
      </Shell>
    </SessionPortContext>
  );
}
