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
import { entityMarks, lineMarks, marksOf, type Mark } from './marks';
import { Outcome, type SaveOutcome } from './Outcome';
import { PhpCard } from './PhpCard';
import { SaveBar } from './SaveBar';

export const VALIDATE_DELAY = 400;
const VALIDATE_PATH = '/entities/saml20-sp-remote/validate';

interface EntityEditorProps {
  initial: EditedEntity;
  pending: number;
  onSaved: () => void;
  onTitle: (title: string) => void;
}

// The marks shown belong to the text they were computed for.
interface Checked {
  text: string;
  marks: Mark[];
}

function checkedOf(entity: EditedEntity): Checked {
  return { text: entity.php ?? '', marks: entityMarks(entity) };
}

export function EntityEditor({ initial, pending, onSaved, onTitle }: EntityEditorProps) {
  const [view, setView] = useState(initial);
  const [text, setText] = useState(initial.php ?? '');
  const [checked, setChecked] = useState(() => checkedOf(initial));
  // An outcome stands for the text it was reached with, and clears once that text changes.
  const [outcome, setOutcome] = useState<{ text: string; shown: SaveOutcome } | null>(null);
  const [saving, setSaving] = useState(false);
  const current = useRef(text);
  const editor = useRef<EditorHandle>(null);
  const fail = useFailure();
  const refuse = useContext(ReportRefusal);
  const title = view.name ?? view.entityId;
  const dirty = text !== (view.php ?? '');
  const deletion = useDeleteEntity(view.entityId, view.name, SP_LIST);

  useEffect(() => onTitle(title), [title, onTitle]);

  useEffect(() => {
    current.current = text;
    if (text === checked.text) {
      return;
    }
    const timer = setTimeout(() => {
      void postJson<Validation>(VALIDATE_PATH, { entityid: view.entityId, php: text }).then(
        (result) => {
          if (result.ok && current.current === text) {
            setChecked({ text, marks: marksOf(result.data) });
          }
        },
      );
    }, VALIDATE_DELAY);

    return () => clearTimeout(timer);
  }, [text, checked.text, view.entityId]);

  const show = (entity: EditedEntity) => {
    setView(entity);
    setText(entity.php ?? '');
    setChecked(checkedOf(entity));
  };

  const save = async () => {
    setSaving(true);
    const sent = text;
    const result = await postJson<EditedEntity>(`/entities/saml20-sp-remote/save`, {
      entityid: view.entityId,
      version: view.version,
      php: sent,
    });
    setSaving(false);
    if (!result.ok && fail(result.status, view.entityId)) {
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
      bar={<SaveBar dirty={dirty} state={view.state} saving={saving} onSave={() => void save()} onDiscard={discard} />}
    >
      <EditHeader title={title} entityId={view.entityId} onDelete={deletion.ask} />
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
