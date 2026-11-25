import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { PastedFormat, Reading } from './types';

// What was read, held by the browser until it is saved or left (SPEC 9.6); `at` is the path of the step that shows it.
export interface Held {
  at: string;
  text: string;
  format: PastedFormat;
  reading: Reading;
}

interface Hold {
  held: (at: string) => Held | null;
  hold: (held: Held) => void;
}

const HoldContext = createContext<Hold>({ held: () => null, hold: () => undefined });

// Each step keeps its own reading, so the step left behind still has what it showed.
export function PastedHold({ initial = null, children }: { initial?: Held | null; children: ReactNode }) {
  const [by, setBy] = useState<Record<string, Held>>(() => (initial ? { [initial.at]: initial } : {}));
  const held = useCallback((at: string) => by[at] ?? null, [by]);
  const hold = useCallback((next: Held) => setBy((last) => ({ ...last, [next.at]: next })), []);

  return <HoldContext value={{ held, hold }}>{children}</HoldContext>;
}

export function useHold(): Hold {
  return useContext(HoldContext);
}

// The reading held for this step, if it is of that kind.
export function useHeld<K extends Reading['kind']>(at: string, kind: K): (Held & { reading: Extract<Reading, { kind: K }> }) | null {
  const found = useHold().held(at);
  if (found === null || found.reading.kind !== kind) {
    return null;
  }

  return found as Held & { reading: Extract<Reading, { kind: K }> };
}
