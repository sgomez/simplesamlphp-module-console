import { createContext, useContext } from 'react';
import type { Result } from '../../lib/result';
import type { MigrationRun } from './types';

export interface DatabasePort {
  migrate(): Promise<Result<MigrationRun>>;
}

export const DatabasePortContext = createContext<DatabasePort>({ migrate: async () => ({ ok: false, status: 0, body: null }) });

export function useDatabasePort(): DatabasePort {
  return useContext(DatabasePortContext);
}
