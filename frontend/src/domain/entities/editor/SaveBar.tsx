import { Button } from '../../../design-system/Button';
import { Status } from '../../../design-system/Status';

// SPEC 10.8, state labels: the save bar's column.
const PENDING = ['Unpublished', 'Modified', 'To be withdrawn'];

interface SaveBarProps {
  dirty: boolean;
  state: string | null;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  // A new object, unsaved whatever its text: Cancel leaves it.
  onCancel?: (() => void) | undefined;
}

function SaveState({ dirty, state }: { dirty: boolean; state: string | null }) {
  if (dirty) {
    return (
      <Status tone="unsaved" mark="dot">
        Unsaved edits
      </Status>
    );
  }
  if (state === 'Up to date') {
    return (
      <Status tone="live" mark="full">
        Published
      </Status>
    );
  }

  return state !== null && PENDING.includes(state) ? (
    <Status tone="pending" mark="half">
      Saved, not live
    </Status>
  ) : null;
}

export function SaveBar({ dirty, state, saving, onSave, onDiscard, onCancel }: SaveBarProps) {
  if (onCancel) {
    return (
      <div className="save-bar">
        <div className="save-state">
          <Status tone="unsaved" mark="dot">
            Unsaved
          </Status>
        </div>
        <Button variant="quiet" onPress={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" disabled={saving} loading={saving} onPress={onSave}>
          Save
        </Button>
      </div>
    );
  }

  return (
    <div className="save-bar">
      <div className="save-state">
        <SaveState dirty={dirty} state={state} />
      </div>
      {(dirty || (state !== null && PENDING.includes(state))) && (
        <Button variant="quiet" onPress={onDiscard}>
          Discard edits
        </Button>
      )}
      <Button variant="primary" disabled={!dirty || saving} loading={saving} onPress={onSave}>
        Save
      </Button>
    </div>
  );
}
