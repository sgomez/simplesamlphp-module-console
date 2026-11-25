import { createContext, useContext } from 'react';
import type { Screen } from './navigation';

export interface SessionPort {
  // The screens this adapter serves; the sidebar lists no other.
  screens: readonly Screen[];
}

export const SessionPortContext = createContext<SessionPort>({ screens: [] });

export function useSessionPort(): SessionPort {
  return useContext(SessionPortContext);
}
