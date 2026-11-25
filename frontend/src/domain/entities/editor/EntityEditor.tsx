import { useEffect, type ReactNode } from 'react';
import { Page } from '../../../design-system/Page';
import { useEntitiesPort } from '../port';
import { SP_LIST } from '../routes';
import type { EditedEntity } from '../types';
import { useDeleteEntity } from '../useDeleteEntity';
import { EditHeader } from './EditHeader';
import { errorLinks } from './ErrorLinks';
import { Outcome } from './Outcome';
import { PhpView } from './PhpView';
import { SaveBar } from './SaveBar';
import { SettingsView } from './SettingsView';
import { useActions } from './useActions';
import { useEditor } from './useEditor';
import { useSettings } from './useSettings';
import { ViewSwitch } from './ViewSwitch';

export const ADD_TITLE = 'Add service provider';

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
  // Unsaved text it opens with in place of the stored one, as after "Replace from…".
  text?: string;
}

export function EntityEditor({ initial, review, onSaved, onTitle, onCreated, onCancel, saved, text: opened }: EntityEditorProps) {
  const port = useEntitiesPort();
  const edit = useEditor(initial, { onCreated, saved, onSaved, text: opened });
  const settings = useSettings(edit, onCreated !== undefined);
  const { view, text, setText, outcome } = edit;
  const title = onCreated ? ADD_TITLE : (view.name ?? view.entityId);
  const deletion = useDeleteEntity(view, SP_LIST);
  const actions = useActions(view, text, edit.replace, deletion.ask);
  const { hideTidied } = port;
  const unreadable = settings.blocked || (outcome?.kind === 'invalid' && !outcome.readable);

  useEffect(() => onTitle(title), [title, onTitle]);

  return (
    <Page
      width="wide"
      bar={
        <SaveBar
          dirty={settings.dirty}
          state={view.state}
          saving={edit.saving}
          onSave={() => void settings.save()}
          onDiscard={settings.discard}
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
        outcome={outcome}
        title={title}
        state={view.state}
        review={review}
        {...(settings.settings && { items: errorLinks(edit.checked.marks) })}
        onHideTidied={
          hideTidied &&
          (() => {
            hideTidied();
            edit.hideTidied();
          })
        }
      />
      {settings.offered && <ViewSwitch settings={settings.settings} unreadable={unreadable} onSelect={(next) => void settings.select(next)} />}
      {settings.settings ? (
        <SettingsView
          doc={settings.doc}
          stored={settings.stored}
          marks={edit.checked.marks}
          text={text}
          onChange={settings.change}
          onEdit={() => void settings.select('php')}
        />
      ) : (
        <PhpView text={text} marks={edit.checked.marks} busy={edit.saving} onChange={setText} />
      )}
    </Page>
  );
}
