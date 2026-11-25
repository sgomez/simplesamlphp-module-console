import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { useLoad, type Loaded } from '../session';
import { useAuditPort, type AuditAction, type AuditPage, type AuditQuery } from './port';

// The board's labels first, in its order.
export const ACTIONS: Record<AuditAction, string> = {
  edit: 'Saved',
  publish: 'Published',
  disable: 'Disabled',
  delete: 'Deleted',
  rollback: 'Rolled back',
  create: 'Created',
  enable: 'Enabled',
  discard: 'Discarded',
  import: 'Imported',
  reviewed: 'Reviewed',
  migrate: 'Migrated',
};

function actionOf(value: string | null): AuditAction | null {
  return value !== null && value in ACTIONS ? (value as AuditAction) : null;
}

export interface AuditTrail {
  query: AuditQuery;
  answer: Loaded<AuditPage>;
  // The address of the same filters on another page.
  pageTo: (page: number) => string;
  filter: (change: Partial<Record<'object' | 'action' | 'from' | 'to', string>>) => void;
}

// SPEC 10.15: filters and page live in the query string.
export function useAuditTrail(): AuditTrail {
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const port = useAuditPort();
  const query: AuditQuery = {
    object: params.get('object') ?? '',
    action: actionOf(params.get('action')),
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
    page: Math.max(Number(params.get('page')) || 1, 1),
  };
  const answer = useLoad(`audit?${params}`, () => port.trail(query));

  const address = (search: URLSearchParams) => (search.size > 0 ? `${pathname}?${search}` : pathname);
  const pageTo = (page: number) => {
    const search = new URLSearchParams(params);
    search.set('page', String(page));

    return address(search);
  };
  const filter: AuditTrail['filter'] = (change) => {
    const search = new URLSearchParams(params);
    search.delete('page');
    for (const [key, value] of Object.entries(change)) {
      if (value === '') {
        search.delete(key);
      } else {
        search.set(key, value);
      }
    }
    void navigate(address(search));
  };

  return { query, answer, pageTo, filter };
}
