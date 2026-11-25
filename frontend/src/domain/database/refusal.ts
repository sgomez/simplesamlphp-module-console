import { createContext } from 'react';
import type { DatabaseRefusal } from './types';

export function refusalOf(status: number, body: unknown): DatabaseRefusal | null {
  return status === 503 && typeof body === 'object' && body !== null && 'state' in body ? (body as DatabaseRefusal) : null;
}

// A screen whose API call answers 503 hands the state up, so the state page replaces it.
export const ReportRefusal = createContext<(refusal: DatabaseRefusal) => void>(() => undefined);
