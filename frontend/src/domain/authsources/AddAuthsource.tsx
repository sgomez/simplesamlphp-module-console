import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '../../design-system/Button';
import { Card } from '../../design-system/Card';
import { FileButton } from '../../design-system/FileButton';
import { ChevronIcon } from '../../design-system/icons';
import { Row } from '../../design-system/Row';
import { LinkSegmented } from '../../design-system/Segmented';
import { TextArea } from '../../design-system/TextArea';
import { AUTHSOURCE_NEW, startPath } from './port';

// SPEC 6.5: the five Authsource types, each with what it is for.
const TYPES: readonly [string, string][] = [
  ['saml:SP', 'Log in through an external identity provider'],
  ['ldap:Ldap', 'Check passwords against an LDAP directory'],
  ['sqlauth:SQL2', 'Check passwords with a SQL query'],
  ['multiauth:MultiAuth', 'Let people choose between several authsources'],
  ['exampleauth:UserPass', 'Fixed test users. Not for production'],
];

const SOURCES = [
  { key: 'paste', label: 'Paste', to: AUTHSOURCE_NEW },
  { key: 'upload', label: 'Upload', to: `${AUTHSOURCE_NEW}?source=upload` },
  { key: 'empty', label: 'Start empty', to: `${AUTHSOURCE_NEW}?source=empty` },
] as const;

function Types() {
  return (
    <Card list>
      {TYPES.map(([type, purpose]) => (
        <Row key={type} wrap to={startPath(type)}>
          <div className="row-main">
            <span className="mono row-id">{type}</span>
            <span className="small muted">{purpose}</span>
          </div>
          <ChevronIcon />
        </Row>
      ))}
    </Card>
  );
}

// SPEC 10.12: the paste area of an authsource; Upload reads a local file into it.
export function AddAuthsource() {
  const navigate = useNavigate();
  const wanted = useSearchParams()[0].get('source');
  const source = SOURCES.find(({ key }) => key === wanted)?.key ?? 'paste';
  const [text, setText] = useState('');
  const loaded = (read: string) => {
    setText(read);
    void navigate(AUTHSOURCE_NEW);
  };

  return (
    <>
      <LinkSegmented label="Source" segments={SOURCES} current={source} />
      {source === 'empty' && <Types />}
      {source === 'upload' && (
        <div>
          <FileButton label="Choose file" onText={loaded} />
        </div>
      )}
      {source === 'paste' && (
        <>
          <TextArea label="PHP array" placeholder="PHP array" mono rows={12} value={text} onChange={setText} />
          <div className="add-actions">
            <Button variant="primary" disabled>
              Review
            </Button>
          </div>
        </>
      )}
    </>
  );
}
