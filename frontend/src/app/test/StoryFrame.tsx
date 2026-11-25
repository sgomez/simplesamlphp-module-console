import type { ReactNode } from 'react';
import { EntitiesPortContext, type EntitiesPort } from '../../domain/entities';
import { Shell, type Crumb } from '../Shell';

const links = {
  identity: 'admin',
  adminUrl: '/simplesaml/module.php/admin/',
  logoutUrl: '/simplesaml/module.php/core/logout/admin',
};

interface StoryFrameProps {
  crumbs: readonly Crumb[];
  pending?: number;
  entities: EntitiesPort;
  children: ReactNode;
}

// A page story inside the Console's chrome, over in-memory ports.
export function StoryFrame({ crumbs, pending = 0, entities, children }: StoryFrameProps) {
  return (
    <Shell session={links} pending={pending} crumbs={crumbs}>
      <EntitiesPortContext value={entities}>{children}</EntitiesPortContext>
    </Shell>
  );
}
