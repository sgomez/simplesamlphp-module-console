import { useEffect, useRef, useState } from 'react';
import type { Doc } from '../../forms';
import { useEntitiesPort } from '../port';
import type { EditedEntity, Refusal } from '../types';
import { marksOf } from './marks';
import type { useEditor } from './useEditor';

type Edit = ReturnType<typeof useEditor>;

const TRANSLATE_DELAY = 400;

const sameDoc = (a: Doc, b: Doc) => JSON.stringify(a) === JSON.stringify(b);

// SPEC 10.9, two views: the form edits the document; its PHP, translated by the server once typing pauses, is what
// is validated and saved.
export function useSettings(edit: Edit, isNew: boolean) {
  const port = useEntitiesPort();
  const { view: translate } = port;
  const offered = translate !== undefined && !isNew;
  const [mode, setMode] = useState<'settings' | 'php'>(offered && edit.view.view === 'settings' && edit.view.document ? 'settings' : 'php');
  // A document stands for the object it was edited from, and gives way once another is shown.
  const [edited, setEdited] = useState<{ of: EditedEntity; doc: Doc } | null>(null);
  // The text that could not be read when the switch was asked for.
  const [blocked, setBlocked] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const stored = edit.view.document ?? {};
  const doc = edited?.of === edit.view ? edited.doc : stored;
  const entityId = isNew ? null : edit.view.entityId;
  const { setText } = edit;

  useEffect(() => () => clearTimeout(timer.current), []);

  const toPhp = async (next: Doc): Promise<string | null> => {
    clearTimeout(timer.current);
    const answer = await translate?.({ entityId, document: next });
    if (!answer?.ok) {
      return null;
    }
    setText(answer.data.php);

    return answer.data.php;
  };

  const change = (next: Doc) => {
    setEdited({ of: edit.view, doc: next });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void toPhp(next), TRANSLATE_DELAY);
  };

  const toSettings = async () => {
    const answer = await translate?.({ entityId, php: edit.text });
    if (answer?.ok) {
      setEdited({ of: edit.view, doc: answer.data.document });
      setBlocked(null);
      setMode('settings');
    } else if (answer?.status === 422) {
      setBlocked(edit.text);
      edit.setChecked({ text: edit.text, marks: marksOf(answer.body as Refusal) });
    }
  };

  const select = async (next: 'settings' | 'php') => {
    if (next === 'settings') {
      await toSettings();
    } else {
      await toPhp(doc);
      setMode('php');
    }
  };

  const settings = offered && mode === 'settings';

  return {
    offered,
    settings,
    blocked: blocked === edit.text,
    doc,
    stored,
    change,
    select,
    dirty: edit.dirty || (settings && !sameDoc(doc, stored)),
    save: async () => {
      if (!settings) {
        await edit.save();

        return;
      }
      const php = await toPhp(doc);
      if (php !== null) {
        await edit.save(php);
      }
    },
    discard: () => {
      clearTimeout(timer.current);
      setEdited(null);
      edit.discard();
    },
  };
}
