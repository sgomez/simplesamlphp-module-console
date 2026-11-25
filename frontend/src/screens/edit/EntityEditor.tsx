import { useContext, useEffect, useRef, useState } from 'react';
import { postJson } from '../../api/client';
import type { EditedEntity, Refusal, Validation } from '../../api/types';
import { useFailure } from '../../app/failure';
import { Page } from '../../app/Page';
import { SP_LIST } from '../../app/paths';
import { refusalOf, ReportRefusal } from '../../app/refusals';
import type { EditorHandle } from '../../components/ui/Editor';
import { useDeleteEntity } from '../DeleteEntity';
import { EditHeader } from './EditHeader';
import { Marks } from './Marks';
import { checkedOf, lineMarks, marksOf } from './marks';
import { useValidation, VALIDATE_PATH } from './useValidation';
import { Outcome, type SaveOutcome } from './Outcome';
import { PhpCard } from './PhpCard';
import { SaveBar } from './SaveBar';

interface EntityEditorProps {
  initial: EditedEntity;
  pending: number;
  onSaved: () => void;
  onTitle: (title: string) => void;
  // A new object: Save creates it.
  onCreated?: (entity: EditedEntity) => void;
  onCancel?: () => void;
  // Opened right after the save that produced it.
  saved?: boolean;
}

export function EntityEditor({ initial, pending, onSaved, onTitle, onCreated, onCancel, saved }: EntityEditorProps) {
  const [view, setView] = useState(initial);
  const [text, setText] = useState(initial.php ?? '');
  // An outcome stands for the text it was reached with, and clears once that text changes.
  const [outcome, setOutcome] = useState<{ text: string; shown: SaveOutcome } | null>(
    saved ? { text: initial.php ?? '', shown: { kind: 'saved' } } : null,
  );
  const [saving, setSaving] = useState(false);
  const { checked, setChecked, current } = useValidation(initial, text, view.entityId);
  const editor = useRef<EditorHandle>(null);
  const fail = useFailure();
  const refuse = useContext(ReportRefusal);
  const title = onCreated ? 'New service provider' : (view.name ?? view.entityId);
  const dirty = text !== (view.php ?? '');
  const deletion = useDeleteEntity(view, SP_LIST);

  useEffect(() => onTitle(title), [title, onTitle]);

  const show = (entity: EditedEntity) => {
    setView(entity);
    setText(entity.php ?? '');
    setChecked(checkedOf(entity));
  };

  const save = async () => {
    setSaving(true);
    const sent = text;
    const result = await postJson<EditedEntity>(
      `/entities/saml20-sp-remote/save`,
      onCreated ? { php: sent } : { entityid: view.entityId, version: view.version, php: sent },
    );
    setSaving(false);
    if (!result.ok && fail(result.status, view.entityId)) {
      return;
    }
    if (result.ok && onCreated) {
      onSaved();
      onCreated(result.data);

      return;
    }
    if (result.ok || result.status === 409) {
      const entity = result.ok ? result.data : (result.body as EditedEntity);
      show(entity);
      setOutcome({ text: entity.php ?? '', shown: { kind: result.ok ? 'saved' : 'race' } });
      onSaved();
    } else if (result.status === 422) {
      const refusal = result.body as Refusal;
      setChecked({ text: sent, marks: marksOf(refusal) });
      setOutcome({ text: sent, shown: { kind: 'invalid', count: refusal.errors.length, readable: refusal.readable } });
      const check = await postJson<Validation>(VALIDATE_PATH, { entityid: view.entityId, php: sent });
      if (check.ok && current.current === sent) {
        setChecked({ text: sent, marks: marksOf({ ...refusal, warnings: check.data.warnings }) });
      }
    } else {
      const refused = refusalOf(result.status, result.body);
      if (refused) {
        refuse(refused);
      } else {
        setOutcome({ text: sent, shown: { kind: 'failed', status: result.status } });
      }
    }
  };

  const discard = () => {
    show(view);
    setOutcome(null);
  };

  return (
    <Page
      wide
      bar={
        <SaveBar
          dirty={dirty}
          state={view.state}
          saving={saving}
          onSave={() => void save()}
          onDiscard={discard}
          onCancel={onCancel}
        />
      }
    >
      {onCreated ? (
        <EditHeader title={title} entityId={null} />
      ) : (
        <EditHeader title={title} entityId={view.entityId} onDelete={deletion.ask} />
      )}
      {deletion.element}
      <Outcome outcome={outcome?.text === text ? outcome.shown : null} title={title} state={view.state} pending={pending} />
      <div className="cols">
        <div className="col-main">
          <Marks marks={checked.marks} onLine={(line) => editor.current?.goToLine(line)} />
          <PhpCard value={text} marks={lineMarks(checked.marks)} editor={editor} busy={saving} onChange={setText} />
        </div>
      </div>
    </Page>
  );
}
