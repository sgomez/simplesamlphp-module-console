import { createContext } from 'react';
import { useLocation, useNavigationType } from 'react-router';
import { Callout } from '../design-system/Callout';
import { RunMessage, type MigrationRun } from '../domain/database';
import type { EditedEntity } from '../domain/entities';

// A one-shot message: the outcome of Run migrations, a text such as "Deleted.", or the entity a create answered,
// which its edit screen shows as saved.
export type Said = MigrationRun | string | { created: EditedEntity };

// Hands the outcome of a POST to the screen that follows, at `to` when given.
export const ReportOutcome = createContext<(said: Said, to?: string) => void>(() => undefined);

// The history state of a redirect, which takes the one-shot message along; any other move ends it, even a click
// on a link to the same URL, which the router also makes a replace.
export const CARRY = { carry: true };

export function useCarried(): boolean {
  const { state } = useLocation();

  return useNavigationType() === 'REPLACE' && typeof state === 'object' && state !== null && 'carry' in state;
}

export function runOf(said: Said | null): MigrationRun | null {
  return said === null || typeof said === 'string' || 'created' in said ? null : said;
}

// The one-shot message of a POST at the top of the page; a created entity's edit screen says it is saved itself.
export function OutcomeMessage({ said }: { said: Said }) {
  if (typeof said === 'string') {
    return <Callout kind="success" title={said} />;
  }
  const run = runOf(said);

  return run && <RunMessage run={run} />;
}
