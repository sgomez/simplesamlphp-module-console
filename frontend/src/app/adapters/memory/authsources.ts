import type { AuthsourceList, AuthsourceRow, AuthsourcesPort } from '../../../domain/authsources';
import type { Failed } from '../../../lib/result';
import { inSnapshot } from './rows';

export function authsource(id: string, type: string, more: Partial<AuthsourceRow> = {}): AuthsourceRow {
  return { id, type, state: 'Up to date', labels: [], unreadable: false, error: null, inSnapshot: inSnapshot(more.state), ...more };
}

// The Authsources board.
export const boardAuthsources: AuthsourceList = {
  managed: [
    authsource('default-sp', 'saml:SP', { state: 'Modified' }),
    authsource('guest-sql', 'sqlauth:SQL2'),
    authsource('staff-or-guest', 'multiauth:MultiAuth'),
    authsource('test-users', 'exampleauth:UserPass'),
    authsource('university-ldap', 'ldap:Ldap'),
  ],
  file: [
    { id: 'admin', type: 'core:AdminPassword', shadows: false },
    { id: 'default-sp', type: 'saml:SP', shadows: true },
  ],
};

export interface MemoryAuthsources {
  list?: AuthsourceList;
  failure?: Failed;
  // What a delete answers in place of success.
  removal?: Failed;
}

export function memoryAuthsources({ list = boardAuthsources, failure, removal }: MemoryAuthsources = {}): AuthsourcesPort {
  let managed = list.managed;

  return {
    list: async () => (failure ? { ok: false, ...failure } : { ok: true, data: { managed, file: list.file } }),
    remove: async (id) => {
      if (removal) {
        return { ok: false, ...removal };
      }
      managed = managed.filter((row) => row.id !== id);

      return { ok: true, data: {} };
    },
  };
}
