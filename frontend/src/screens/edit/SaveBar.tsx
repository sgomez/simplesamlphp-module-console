import { Button } from '../../design-system/Button';
import { Status, type StatusMark, type StatusTone } from '../../design-system/Status';

const states: Record<string, { tone: StatusTone; mark: StatusMark }> = {
  Unpublished: { tone: 'pending', mark: 'dot' },
  Modified: { tone: 'pending', mark: 'half' },
  'Up to date': { tone: 'live', mark: 'full' },
};

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
  const look = state === null ? undefined : states[state];

  return look === undefined ? null : (
    <Status tone={look.tone} mark={look.mark}>
      {state}
    </Status>
  );
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
      {dirty && (
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
