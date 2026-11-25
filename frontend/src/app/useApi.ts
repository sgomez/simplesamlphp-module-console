import { useEffect, useState } from 'react';
import { getJson } from '../api/client';
import { useSettle } from './settle';

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
  const settle = useSettle();
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
      setAnswer({ path, state: { state: 'failed', status: result.status, body: result.body } });
      settle(result, () => undefined, entityId);
    });

    return () => {
      live = false;
    };
  }, [path, entityId, revision, settle]);

  return answer?.path === path ? answer.state : loading;
}
