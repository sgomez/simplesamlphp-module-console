import { Button } from '../../components/ui/Button';
import { Status, type StatusMark, type StatusTone } from '../../components/ui/Status';

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

export function SaveBar({ dirty, state, saving, onSave, onDiscard }: SaveBarProps) {
  return (
    <div className="save-bar">
      <div className="save-state">
        <SaveState dirty={dirty} state={state} />
      </div>
      {dirty && (
        <Button variant="quiet" onClick={onDiscard}>
          Discard edits
        </Button>
      )}
      <Button variant="primary" disabled={!dirty || saving} loading={saving} onClick={onSave}>
        Save
      </Button>
    </div>
  );
}
