import { useContext, useEffect, useState } from 'react';
import { getJson } from '../api/client';
import { useFailure } from './failure';
import { refusalOf, ReportRefusal } from './refusals';

export type ApiState<T> =
  | { state: 'loading' }
  | { state: 'ready'; data: T }
  | { state: 'failed'; status: number; body: unknown };

const loading = { state: 'loading' } as const;

interface ApiOptions {
  entityId?: string;
  revision?: number;
}

// A 403 or 404 replaces the screen (entityId names the missing object), a 503 shows the state page; a 401 reloads.
// A new revision asks for the path again and keeps the last answer until the new one arrives.
export function useApi<T>(path: string, { entityId, revision = 0 }: ApiOptions = {}): ApiState<T> {
  const fail = useFailure();
  const refuse = useContext(ReportRefusal);
  const [answer, setAnswer] = useState<{ path: string; state: ApiState<T> } | null>(null);

  useEffect(() => {
    let live = true;
    void getJson<T>(path).then((result) => {
      if (!live) {
        return;
      }
      if (result.ok) {
        setAnswer({ path, state: { state: 'ready', data: result.data } });

        return;
      }
      fail(result.status, entityId);
      setAnswer({ path, state: { state: 'failed', status: result.status, body: result.body } });
      const refused = refusalOf(result.status, result.body);
      if (refused) {
        refuse(refused);
      }
    });

    return () => {
      live = false;
    };
  }, [path, entityId, revision, fail, refuse]);

  return answer?.path === path ? answer.state : loading;
}
