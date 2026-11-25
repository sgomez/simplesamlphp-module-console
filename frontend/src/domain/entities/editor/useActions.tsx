import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Callout } from '../../../design-system/Callout';
import { ConfirmDialog } from '../../../design-system/ConfirmDialog';
import type { MenuEntry } from '../../../design-system/Menu';
import { failureText } from '../../../lib/failureText';
import type { Result } from '../../../lib/result';
import { useSettle } from '../../session';
import { useEntitiesPort } from '../port';
import type { EditedEntity } from '../types';
import type { Enabled } from './EditHeader';
import { downloadPhp } from './PhpCard';

// SPEC 8.3: what a discard does, by state.
const DISCARDS: Record<string, string> = {
  Modified: 'returns to its published version.',
  'To be withdrawn': 'returns to its published version, enabled.',
  Unpublished: 'is disabled and stays saved as Not live.',
};

interface Ask {
  title: string;
  text: string;
  cancel: string;
  confirm: string;
  lead: string;
  run: (entityId: string) => Promise<Result<EditedEntity>>;
}

interface Actions {
  entries: MenuEntry[];
  enabled: Enabled | null;
  // The confirmation dialog and what went wrong with the last action.
  element: ReactNode;
}

// The header's controls besides Save; those the port does not offer stay hidden.
export function useActions(view: EditedEntity, text: string, onDone: (entity: EditedEntity) => void, onDelete: () => void): Actions {
  const port = useEntitiesPort();
  const navigate = useNavigate();
  const settle = useSettle();
  const [ask, setAsk] = useState<Ask | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<{ lead: string; status: number } | null>(null);
  const label = view.name ?? view.entityId;

  const act = async (lead: string, run: Ask['run']) => {
    setFailed(null);
    setBusy(true);
    const result = await run(view.entityId);
    setBusy(false);
    setOpen(false);
    if (result.ok) {
      onDone(result.data);
    } else {
      settle(result, (status) => setFailed({ lead, status }), view.entityId);
    }
  };

  const { replacePath, discard, promote, setEnabled } = port;
  const asking = (next: Ask) => () => {
    setAsk(next);
    setOpen(true);
  };
  const discarding = view.state === null ? undefined : DISCARDS[view.state];
  const entries: MenuEntry[] = [
    ...(replacePath ? [{ label: 'Replace from…', onSelect: () => void navigate(replacePath(view.entityId)) }] : []),
    { label: 'Download', onSelect: () => downloadPhp(text) },
    ...(discard && discarding
      ? [{ label: 'Discard changes…', onSelect: asking({ title: `Discard changes to ${label}?`, text: `${label} ${discarding}`, cancel: 'Keep changes', confirm: 'Discard changes', lead: 'Not discarded', run: discard }) }]
      : []),
    ...(promote && view.nextKey
      ? [{ label: 'Promote…', onSelect: asking({ title: `Promote the next key of ${label}?`, text: 'The previous key leaves the configuration. Messages encrypted to the old certificate will no longer decrypt.', cancel: 'Cancel', confirm: 'Promote', lead: 'Not promoted', run: promote }) }]
      : []),
    { label: 'Delete…', onSelect: onDelete, danger: true, separated: true },
  ];
  const on = view.enabled ?? true;
  const enabled = setEnabled
    ? { on, onChange: (next: boolean) => void act(next ? 'Not enabled' : 'Not disabled', (entityId) => setEnabled(entityId, next)) }
    : null;

  const element = (
    <>
      {failed && <Callout kind="error" title={failureText(failed.lead, failed.status)} />}
      {ask && (
        <ConfirmDialog
          open={open}
          title={ask.title}
          text={ask.text}
          cancel={ask.cancel}
          confirm={ask.confirm}
          busy={busy}
          onCancel={() => setOpen(false)}
          onConfirm={() => void act(ask.lead, ask.run)}
        />
      )}
    </>
  );

  return { entries, enabled, element };
}
