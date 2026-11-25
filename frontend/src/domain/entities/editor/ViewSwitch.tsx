import { Segmented } from '../../../design-system/Segmented';

interface ViewSwitchProps {
  settings: boolean;
  // The PHP text cannot be read: Settings waits for it.
  unreadable: boolean;
  onSelect: (view: 'settings' | 'php') => void;
}

// SPEC 10.9, two views of the same object.
export function ViewSwitch({ settings, unreadable, onSelect }: ViewSwitchProps) {
  return (
    <div className="view-switch">
      <Segmented
        label="View"
        current={settings ? 'settings' : 'php'}
        segments={[
          { key: 'settings', label: 'Settings', disabled: unreadable && !settings, onSelect: () => onSelect('settings') },
          { key: 'php', label: 'PHP', onSelect: () => onSelect('php') },
        ]}
      />
      {unreadable && !settings && <span className="small muted">Settings opens once the text can be read</span>}
    </div>
  );
}
