import { useEffect, useEffectEvent, useState } from 'react';
import type { Result } from '../../lib/result';
import { useSettle } from './failure';

export type Loaded<T> =
  | { state: 'loading' }
  | { state: 'ready'; data: T }
  | { state: 'failed'; status: number; body: unknown };

const loading = { state: 'loading' } as const;

interface LoadOptions {
  entityId?: string | undefined;
  revision?: number | undefined;
}

// `key` names the request: a new key asks again and shows loading, a new revision asks again and keeps the last answer.
// A 403 or 404 replaces the screen (entityId names the missing object), a 503 shows the state page.
export function useLoad<T>(key: string, load: () => Promise<Result<T>>, { entityId, revision = 0 }: LoadOptions = {}): Loaded<T> {
  const settle = useSettle();
  const [answer, setAnswer] = useState<{ key: string; state: Loaded<T> } | null>(null);
  const request = useEffectEvent(load);

  useEffect(() => {
    let live = true;
    void request().then((result) => {
      if (!live) {
        return;
      }
      if (result.ok) {
        setAnswer({ key, state: { state: 'ready', data: result.data } });

        return;
      }
      setAnswer({ key, state: { state: 'failed', status: result.status, body: result.body } });
      settle(result, () => undefined, entityId);
    });

    return () => {
      live = false;
    };
  }, [key, entityId, revision, settle]);

  return answer?.key === key ? answer.state : loading;
}
