// The API routes below api/; the client routes are in app/paths.ts.
const SP = '/entities/saml20-sp-remote';

export const API = {
  session: '/session',
  publication: '/publication',
  migrate: '/migrate',
  spList: SP,
  spEntity: `${SP}/entity`,
  spSave: `${SP}/save`,
  spValidate: `${SP}/validate`,
  spDelete: `${SP}/delete`,
} as const;

export function spListOf(search: URLSearchParams): string {
  return search.size > 0 ? `${API.spList}?${search}` : API.spList;
}

export function spEntityOf(entityId: string): string {
  return `${API.spEntity}?entityid=${encodeURIComponent(entityId)}`;
}
