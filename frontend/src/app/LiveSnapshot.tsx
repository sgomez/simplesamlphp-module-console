import type { CurrentSnapshot } from '../api/types';
import { Status } from '../components/ui/Status';

const when = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

// The header of Publish shows the current Snapshot and when it was published (SPEC 10.3), in local time.
export function LiveSnapshot({ current }: { current: CurrentSnapshot }) {
  return (
    <Status tone="live" mark="full">
      <span>{`Live: Snapshot #${current.number}`}</span>
      {current.createdAt !== null && <span className="faint status-when">{` · ${when.format(new Date(current.createdAt))}`}</span>}
    </Status>
  );
}
