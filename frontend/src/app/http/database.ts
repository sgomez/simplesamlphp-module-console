import type { DatabasePort, MigrationRun } from '../../domain/database';
import { postJson } from './client';
import { API } from './paths';

export const httpDatabase: DatabasePort = {
  migrate: () => postJson<MigrationRun>(API.migrate, {}),
};
