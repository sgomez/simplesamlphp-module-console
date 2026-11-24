import { useEffect, useState } from 'react';
import { getJson } from '../api/client';

export function useApi<T>(path: string): T | null {
  const [answer, setAnswer] = useState<{ path: string; data: T } | null>(null);

  useEffect(() => {
    let live = true;
    void getJson<T>(path).then((result) => {
      if (live && result.ok) {
        setAnswer({ path, data: result.data });
      }
    });

    return () => {
      live = false;
    };
  }, [path]);

  return answer?.path === path ? answer.data : null;
}
