import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ADD_TITLE, EntityEditor } from '../editor/EntityEditor';
import { NewEntity } from '../editor/NewEntity';
import { useEntitiesPort } from '../port';
import { SP_LIST } from '../routes';
import type { EditedEntity } from '../types';
import { PasteArea, SOURCES } from './PasteArea';

interface AddEntityProps {
  onSaved: () => void;
  onTitle: (title: string) => void;
  onCreated: (entity: EditedEntity) => void;
}

// SPEC 10.12. Without a server that reads pasted configuration, only Start empty: the starter editor.
export function AddEntity({ onTitle, ...props }: AddEntityProps) {
  const { readPasted } = useEntitiesPort();
  const navigate = useNavigate();
  const wanted = useSearchParams()[0].get('source');
  const source = SOURCES.find(({ key }) => key === wanted)?.key ?? 'paste';
  const [read, setRead] = useState<EditedEntity | null>(null);
  const editing = { ...props, onTitle, onCancel: () => void navigate(SP_LIST) };
  const pasting = readPasted !== undefined && source !== 'empty' && read === null;

  useEffect(() => {
    if (pasting) {
      onTitle(ADD_TITLE);
    }
  }, [pasting, onTitle]);

  if (!readPasted || source === 'empty') {
    return <NewEntity {...editing} />;
  }
  if (read !== null) {
    return <EntityEditor initial={read} {...editing} />;
  }

  return <PasteArea source={source} read={readPasted} onRead={setRead} />;
}
