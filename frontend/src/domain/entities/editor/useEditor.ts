import { useState } from 'react';
import { useSettle } from '../../session';
import { useEntitiesPort } from '../port';
import type { EditedEntity } from '../types';
import { checkedOf, marksOf } from './marks';
import type { SaveOutcome } from './Outcome';
import { useValidation } from './useValidation';

interface EditorOptions {
  // A new object: a save creates it and moves on.
  onCreated?: ((entity: EditedEntity) => void) | undefined;
  // Opened right after the save that produced it.
  saved?: boolean | undefined;
  // A save changed what the session answers.
  onSaved: () => void;
}

// The text on screen, the object it was loaded from, and what the last save came to.
export function useEditor(initial: EditedEntity, { onCreated, saved, onSaved }: EditorOptions) {
  const port = useEntitiesPort();
  const settle = useSettle();
  const [view, setView] = useState(initial);
  const [text, setText] = useState(initial.php ?? '');
  // An outcome stands for the text it was reached with, and clears once that text changes.
  const [outcome, setOutcome] = useState<{ text: string; shown: SaveOutcome } | null>(
    saved ? { text: initial.php ?? '', shown: { kind: 'saved' } } : null,
  );
  const [saving, setSaving] = useState(false);
  const { checked, setChecked, current } = useValidation(initial, text, view.entityId);

  const show = (entity: EditedEntity) => {
    setView(entity);
    setText(entity.php ?? '');
    setChecked(checkedOf(entity));
  };

  // sent: the text of the Settings view, translated just before.
  const save = async (sent = text) => {
    setSaving(true);
    const result = await port.save(onCreated ? { php: sent } : { entityId: view.entityId, version: view.version, php: sent });
    setSaving(false);
    switch (result.kind) {
      case 'saved':
        // A create moves on with a one-shot outcome, which refreshes the session.
        if (onCreated) {
          onCreated(result.entity);

          return;
        }
        show(result.entity);
        setOutcome({ text: result.entity.php ?? '', shown: { kind: 'saved', ...(result.tidied && { tidied: result.tidied }) } });
        onSaved();
        break;
      case 'race':
        show(result.entity);
        setOutcome({ text: result.entity.php ?? '', shown: { kind: 'race', ...(result.by && { by: result.by }) } });
        onSaved();
        break;
      case 'invalid': {
        const { refusal } = result;
        setChecked({ text: sent, marks: marksOf(refusal) });
        setOutcome({ text: sent, shown: { kind: 'invalid', count: refusal.errors.length, readable: refusal.readable } });
        const check = await port.validate(view.entityId, sent);
        if (check.ok && current.current === sent) {
          setChecked({ text: sent, marks: marksOf({ ...refusal, warnings: check.data.warnings }) });
        }
        break;
      }
      case 'failed':
        settle(result.failed, (status) => setOutcome({ text: sent, shown: { kind: 'failed', status } }), view.entityId);
    }
  };

  // The outcome of another action, such as a discard, replaces that of the last save.
  const replace = (entity: EditedEntity) => {
    show(entity);
    setOutcome(null);
    onSaved();
  };

  return {
    view,
    text,
    setText,
    checked,
    setChecked,
    saving,
    dirty: text !== (view.php ?? ''),
    outcome: outcome?.text === text ? outcome.shown : null,
    save,
    replace,
    discard: () => {
      show(view);
      setOutcome(null);
    },
    hideTidied: () => setOutcome((last) => last && { ...last, shown: { kind: 'saved' } }),
  };
}
