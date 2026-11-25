import { createContext, useContext } from 'react';
import type { Result } from '../../lib/result';
import type { Labelled } from '../entities';

export const AUTHSOURCES = '/authsources';
export const AUTHSOURCE_NEW = `${AUTHSOURCES}/new`;

// SPEC 10.4: /authsources/{id}/edit, since `new` is a valid id.
export function authsourcePath(id: string): string {
  return `${AUTHSOURCES}/${encodeURIComponent(id)}/edit`;
}

// The editor of a new authsource of one type, with its required options only.
export function startPath(type: string): string {
  return `${AUTHSOURCE_NEW}?type=${encodeURIComponent(type)}`;
}

// A managed authsource (SPEC 6.1), labelled as an entity row is.
export interface AuthsourceRow extends Labelled {
  id: string;
  type: string;
  inSnapshot: boolean;
}

// An authsource of the node's authsources.php (SPEC 6.3): id and type only.
export interface FileAuthsource {
  id: string;
  type: string;
  // A managed authsource has the same id, and the file wins.
  shadows: boolean;
}

export interface AuthsourceList {
  managed: AuthsourceRow[];
  file: FileAuthsource[];
}

export interface AuthsourcesPort {
  list(): Promise<Result<AuthsourceList>>;
  remove(id: string): Promise<Result<unknown>>;
}

const unset = async () => ({ ok: false, status: 0, body: null }) as const;

export const AuthsourcesPortContext = createContext<AuthsourcesPort>({ list: unset, remove: unset });

export function useAuthsourcesPort(): AuthsourcesPort {
  return useContext(AuthsourcesPortContext);
}
