import { useEffect, useState } from 'react';
import { getJson } from '../api/client';
import { useFailure } from './failure';

export type ApiState<T> =
  | { state: 'loading' }
  | { state: 'ready'; data: T }
  | { state: 'failed'; status: number; body: unknown };

const loading = { state: 'loading' } as const;

// A 403 or 404 replaces the screen (entityId names the missing object); a 401 reloads the page.
export function useApi<T>(path: string, { entityId }: { entityId?: string } = {}): ApiState<T> {
  const fail = useFailure();
  const [answer, setAnswer] = useState<{ path: string; state: ApiState<T> } | null>(null);

  useEffect(() => {
    let live = true;
    void getJson<T>(path).then((result) => {
      if (live) {
        if (!result.ok) {
          fail(result.status, entityId);
        }
        setAnswer({
          path,
          state: result.ok
            ? { state: 'ready', data: result.data }
            : { state: 'failed', status: result.status, body: result.body },
        });
      }
    });

    return () => {
      live = false;
    };
  }, [path, entityId, fail]);

  return answer?.path === path ? answer.state : loading;
}
