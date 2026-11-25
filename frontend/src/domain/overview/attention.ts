import type { StatusMark, StatusTone } from '../../design-system/Status';
import { plural } from '../../lib/plural';
import { editPath } from '../entities';
import { NODES } from '../nodes';
import { overridePath } from '../overrides';
import { PUBLISH } from '../publication';
import type { Attention } from './port';

export interface Line {
  tone: StatusTone;
  mark: StatusMark;
  text: string;
  to: string;
}

const warn = { tone: 'warn', mark: 'warning' } as const;

function nodeText(item: Extract<Attention, { kind: 'node' }>): string {
  switch (item.problem) {
    case 'behind':
      return `${item.node} is ${plural(item.by, 'Snapshot', 'Snapshots')} behind`;
    case 'silent':
      return `${item.node} has not checked in for ${item.minutes} min`;
    default:
      return `${item.node} has problems`;
  }
}

function expiry(days: number): string {
  return days < 0 ? 'certificate has expired' : `certificate expires in ${plural(days, 'day', 'days')}`;
}

// SPEC 10.7: what each line says and where it leads.
export function lineOf(item: Attention): Line {
  switch (item.kind) {
    case 'pending':
      return { tone: 'pending', mark: 'half', text: `${plural(item.count, 'change', 'changes')} to publish`, to: PUBLISH };
    case 'node':
      return { ...warn, text: nodeText(item), to: NODES };
    case 'certificate':
      return {
        ...(item.days < 0 ? { tone: 'danger', mark: 'error' } : warn),
        text: `${item.name ?? item.entityId}: ${expiry(item.days)}`,
        to: editPath(item.entityId, item.set),
      };
    case 'override':
      return {
        ...warn,
        text: `${item.name ?? item.entityId}: external source ${item.reviewed ? 'changed' : 'not reviewed'}`,
        to: overridePath(item.entityId, item.set),
      };
    default:
      return { ...warn, text: 'console:Snapshot is not in metadata.sources: Override and Shadowed labels mean nothing here', to: NODES };
  }
}
