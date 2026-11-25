import { LinkTabs } from '../../design-system/Tabs';
import { AUDIT, HISTORY } from './history';

const TABS = [
  { key: 'snapshots', label: 'Snapshots', to: HISTORY },
  { key: 'audit', label: 'Audit trail', to: AUDIT },
] as const;

export function HistoryTabs({ current }: { current: 'snapshots' | 'audit' }) {
  return <LinkTabs label="Views" tabs={TABS} current={current} />;
}
