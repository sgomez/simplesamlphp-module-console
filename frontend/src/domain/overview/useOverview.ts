import { useLoad, type Loaded } from '../session';
import { useOverviewPort, type Overview } from './port';

export interface OverviewState {
  answer: Loaded<Overview>;
  // Nothing managed and nothing published.
  firstRun: boolean;
}

export function useOverview(): OverviewState {
  const port = useOverviewPort();
  const answer = useLoad('overview', () => port.overview());
  const firstRun = answer.state === 'ready' && answer.data.current === null && Object.values(answer.data.counts).every((count) => count === 0);

  return { answer, firstRun };
}
