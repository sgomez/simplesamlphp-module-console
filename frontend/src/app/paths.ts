export const SP_LIST = '/entities/saml20-sp-remote';
export const SP_EDIT = `${SP_LIST}/edit`;
export const PUBLISH = '/publish';
export const SP_NEW = `${SP_LIST}/new`;

export function editPath(entityId: string): string {
  return `${SP_EDIT}?entityid=${encodeURIComponent(entityId)}`;
}
