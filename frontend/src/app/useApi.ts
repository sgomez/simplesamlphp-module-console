import { useEffect, useState } from 'react';
import { getJson } from '../api/client';

export type ApiState<T> =
  | { state: 'loading' }
  | { state: 'ready'; data: T }
  | { state: 'failed'; status: number; body: unknown };

const loading = { state: 'loading' } as const;

export function useApi<T>(path: string): ApiState<T> {
  const [answer, setAnswer] = useState<{ path: string; state: ApiState<T> } | null>(null);

  useEffect(() => {
    let live = true;
    void getJson<T>(path).then((result) => {
      if (live) {
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
  }, [path]);

  return answer?.path === path ? answer.state : loading;
}
