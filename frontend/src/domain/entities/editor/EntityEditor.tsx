import { useEffect, useRef, type ReactNode } from 'react';
import type { EditorHandle } from '../../../design-system/Editor';
import { Page } from '../../../design-system/Page';
import type { SchemaOption } from '../../documents';
import { useEntitiesPort } from '../port';
import { SP_LIST } from '../routes';
import type { EditedEntity } from '../types';
import { useDeleteEntity } from '../useDeleteEntity';
import { EditHeader } from './EditHeader';
import { lineMarks } from './marks';
import { Marks } from './Marks';
import { OptionsPanel } from './OptionsPanel';
import { Outcome } from './Outcome';
import { PhpCard } from './PhpCard';
import { insertOption, replaceKey } from './phpText';
import { SaveBar } from './SaveBar';
import { useActions } from './useActions';
import { useEditor } from './useEditor';

export interface EntityEditorProps {
  initial: EditedEntity;
  // The Review button of the success callout, when there are Pending changes.
  review?: ReactNode;
  onSaved: () => void;
  onTitle: (title: string) => void;
  // A new object: Save creates it.
  onCreated?: (entity: EditedEntity) => void;
  onCancel?: () => void;
  // Opened right after the save that produced it.
  saved?: boolean;
}

export function EntityEditor({ initial, review, onSaved, onTitle, onCreated, onCancel, saved }: EntityEditorProps) {
  const port = useEntitiesPort();
  const edit = useEditor(initial, { onCreated, saved, onSaved });
  const { view, text, setText } = edit;
  const editor = useRef<EditorHandle>(null);
  const cursor = useRef<number | null>(null);
  const title = onCreated ? 'New service provider' : (view.name ?? view.entityId);
  const deletion = useDeleteEntity(view, SP_LIST);
  const actions = useActions(view, text, edit.replace, deletion.ask);
  const { hideTidied } = port;

  useEffect(() => onTitle(title), [title, onTitle]);

  useEffect(() => {
    if (cursor.current !== null) {
      editor.current?.focusAt(cursor.current);
      cursor.current = null;
    }
  }, [text]);

  const insert = (option: SchemaOption) => {
    const next = insertOption(text, editor.current?.cursor() ?? text.length, option);
    cursor.current = next.at;
    setText(next.text);
  };

  return (
    <Page
      width="wide"
      bar={
        <SaveBar
          dirty={edit.dirty}
          state={view.state}
          saving={edit.saving}
          onSave={() => void edit.save()}
          onDiscard={edit.discard}
          onCancel={onCancel}
        />
      }
    >
      {onCreated ? (
        <EditHeader title={title} entityId={null} />
      ) : (
        <EditHeader title={title} entityId={view.entityId} enabled={actions.enabled} actions={actions.entries} />
      )}
      {deletion.element}
      {actions.element}
      <Outcome
        outcome={edit.outcome}
        title={title}
        state={view.state}
        review={review}
        onHideTidied={
          hideTidied &&
          (() => {
            hideTidied();
            edit.hideTidied();
          })
        }
      />
      <div className="cols">
        <div className="col-main">
          <Marks
            marks={edit.checked.marks}
            onLine={(line) => editor.current?.goToLine(line)}
            onSuggest={(line, from, to) => setText(replaceKey(text, line, from, to))}
          />
          <PhpCard value={text} marks={lineMarks(edit.checked.marks)} editor={editor} busy={edit.saving} onChange={setText} />
        </div>
        <OptionsPanel text={text} onInsert={insert} />
      </div>
    </Page>
  );
}
