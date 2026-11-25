import { useNavigate, useSearchParams } from 'react-router';
import { Pre } from '../../design-system/Code';
import { Disclosure } from '../../design-system/Disclosure';
import { FileButton } from '../../design-system/FileButton';
import { Page } from '../../design-system/Page';
import { LinkSegmented } from '../../design-system/Segmented';
import { listRoute, NewEntity, SET_WORDS, type EntitySet } from '../entities';
import { CopyFromExternal, PasteArea } from './PasteArea';
import { addPath, usePastedPort } from './port';
import type { Reading } from './types';
import { usePaste } from './usePaste';
import { useSavePasted } from './useSavePasted';

const EXAMPLES: [string, string][] = [
  ['SAML metadata', '<md:EntityDescriptor\n    entityID="https://…">\n  …\n</md:EntityDescriptor>'],
  ['PHP array', "$metadata['https://…'] = [\n    'AssertionConsumerService' => …,\n];"],
];

function Examples() {
  return (
    <Disclosure summary="Examples" card defaultExpanded>
      <div className="examples">
        {EXAMPLES.map(([title, text]) => (
          <div key={title} className="example">
            <span className="small example-title">{title}</span>
            <Pre label={title}>{text}</Pre>
          </div>
        ))}
      </div>
    </Disclosure>
  );
}

function sources(set: EntitySet) {
  const at = addPath(set);

  return [
    { key: 'paste', label: 'Paste', to: at },
    { key: 'upload', label: 'Upload', to: `${at}?source=upload` },
    { key: 'empty', label: 'Start empty', to: `${at}?source=empty` },
  ];
}

export function nextStep(set: EntitySet) {
  return (reading: Reading): string | null => {
    switch (reading.kind) {
      case 'one':
        return addPath(set, '/review');
      case 'several':
        return addPath(set, '/several');
      default:
        return null;
    }
  };
}

// SPEC 10.12 (AddEntity, AddEmpty, AddUnreadable, AddWrongKind): what a new entity of the set starts from.
export function AddFromPaste({ set, external }: { set: EntitySet; external: string }) {
  const port = usePastedPort();
  const navigate = useNavigate();
  const source = useSearchParams()[0].get('source') ?? 'paste';
  const saving = useSavePasted({ kind: 'entity', set });
  const paste = usePaste({ at: addPath(set), read: (text, format) => port.read({ kind: 'entity', set }, text, format), next: nextStep(set) });
  if (source === 'empty') {
    return <NewEntity onSaved={() => undefined} onTitle={() => undefined} onCreated={saving.done} onCancel={() => void navigate(listRoute(set))} />;
  }

  return (
    <Page width="slim">
      <h1 className="h1">{SET_WORDS[set].add}</h1>
      <LinkSegmented label="Source" segments={sources(set)} current={source === 'upload' ? 'upload' : 'paste'} />
      {source === 'upload' ? (
        <div>
          <FileButton
            label="Choose file"
            onText={(text) => {
              paste.setText(text);
              void navigate(addPath(set));
            }}
          />
        </div>
      ) : (
        <>
          <PasteArea paste={paste} label="Metadata XML or PHP array" />
          {paste.text === '' && <Examples />}
        </>
      )}
      <CopyFromExternal to={external} />
    </Page>
  );
}
