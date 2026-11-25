import { useState } from 'react';
import type { Session } from '../api/types';
import { useApi, type ApiState } from './useApi';

// The session as last answered: asking again after a save keeps the screen in place.
export function useSession(revision: number): ApiState<Session> {
  const answer = useApi<Session>('/session', { revision });
  const [last, setLast] = useState<ApiState<Session>>(answer);
  if (answer.state !== 'loading' && answer !== last) {
    setLast(answer);
  }

  return answer.state === 'loading' ? last : answer;
}
