import type { ReactNode } from 'react';
import { EntitiesPortContext } from '../domain/entities';
import { PublicationPortContext } from '../domain/publication';
import { ReportMessage } from '../domain/session';
import { httpEntities } from './http/entities';
import { httpPublication } from './http/publication';
import { ReportOutcome, type Said } from './Page';

// What a screen reaches the server and the next page through.
export function Ports({ announce, children }: { announce: (said: Said, to?: string) => void; children: ReactNode }) {
  return (
    <ReportOutcome value={announce}>
      <ReportMessage value={announce}>
        <EntitiesPortContext value={httpEntities}>
          <PublicationPortContext value={httpPublication}>{children}</PublicationPortContext>
        </EntitiesPortContext>
      </ReportMessage>
    </ReportOutcome>
  );
}
