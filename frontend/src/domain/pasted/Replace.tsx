import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '../../design-system/Button';
import { Callout } from '../../design-system/Callout';
import { Diff } from '../../design-system/Diff';
import { Page } from '../../design-system/Page';
import { plural } from '../../lib/plural';
import { editPath, FilledEntity, useEntitiesPort, type EntitySet } from '../entities';
import { useLoad } from '../session';
import { PasteArea } from './PasteArea';
import { replacePath, usePastedPort } from './port';
import { SaveTroubleCallout, TitleBlock } from './Saving';
import type { Replacement } from './types';
import { usePaste } from './usePaste';
import { useSavePasted } from './useSavePasted';

// SPEC 9.7: metadata XML only, for an entity already managed.
export function ReplacePaste({ set }: { set: EntitySet }) {
  const entityId = useSearchParams()[0].get('entityid') ?? '';
  const entities = useEntitiesPort();
  const port = usePastedPort();
  const stored = useLoad(`entity#${entityId}`, () => entities.read(entityId), { entityId });
  const paste = usePaste({
    at: replacePath(set, entityId),
    read: (xml) => port.replace(set, entityId, xml),
    next: (reading) => (reading.kind === 'replaced' ? replacePath(set, entityId, '/review') : null),
    formats: ['xml'],
  });
  if (stored.state !== 'ready') {
    return null;
  }
  const { name } = stored.data;

  return (
    <Page width="slim">
      <TitleBlock title={`Replace ${name ?? entityId}`} id={entityId} />
      <PasteArea paste={paste} label="Metadata XML" formats={['xml']} />
    </Page>
  );
}

// SPEC 9.7 (ReplaceFrom): the stored entity against the merged one, before it is saved or opened in the editor.
export function ReplaceReview({ set, replacement }: { set: EntitySet; replacement: Replacement }) {
  const { entityId, name, version, php, removed, diff } = replacement;
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const saving = useSavePasted({ kind: 'entity', set }, editPath(entityId, set));
  if (editing) {
    return <FilledEntity php={php} entityId={entityId} onCreated={saving.done} onCancel={() => setEditing(false)} />;
  }
  const bar = (
    <div className="save-bar">
      <div className="save-state" />
      <Button variant="quiet" onPress={() => void navigate(editPath(entityId, set))}>
        Cancel
      </Button>
      <Button onPress={() => setEditing(true)}>Edit first</Button>
      <Button variant="primary" loading={saving.saving} onPress={() => void saving.save({ entityId, version, php })}>
        Save
      </Button>
    </div>
  );

  return (
    <Page width="slim" bar={bar}>
      <TitleBlock title={`Replace ${name ?? entityId}`} id={entityId} />
      <span className="small muted">From SAML metadata</span>
      <SaveTroubleCallout trouble={saving.trouble} />
      {removed > 0 && <Callout kind="warning" title={`This removes ${plural(removed, 'option', 'options')}`} />}
      <Diff lines={diff} />
    </Page>
  );
}
