import type { CurrentSnapshot } from '../session';
import { Status } from '../../design-system/Status';

export function LiveSnapshot({ current }: { current: CurrentSnapshot }) {
  return (
    <Status tone="live" mark="full">
      {`Live: Snapshot #${current.number}`}
    </Status>
  );
}
