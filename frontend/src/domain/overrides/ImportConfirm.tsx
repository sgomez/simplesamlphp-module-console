import { useContext, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '../../design-system/Button';
import { Callout } from '../../design-system/Callout';
import { Card } from '../../design-system/Card';
import { Eid } from '../../design-system/Eid';
import { Page } from '../../design-system/Page';
import { Row } from '../../design-system/Row';
import { failureText } from '../../lib/failureText';
import { CreationMessage, headline } from '../pasted';
import { ReportMessage, useLoad, useSettle } from '../session';
import { externalPath } from './external';
import { useOverridesPort } from './port';
import { importPath, selectionOf, type ImportPreview } from './selection';

const number = new Intl.NumberFormat('en');

function Sources({ preview }: { preview: ImportPreview }) {
  return preview.sources.map(({ heading, location, entities }) => (
    <section key={location} className="src">
      <div className="src-head">
        <h2 className="h2">{heading}</h2>
        <span className="mono muted wrap-any">{location}</span>
        <span className="small muted src-count">{number.format(entities.length)}</span>
      </div>
      <Card list>
        {entities.map(({ entityId, name }) => (
          <Row key={entityId} plain>
            <div className="row-main">
              {name !== null && <span className="row-name">{name}</span>}
              <Eid id={entityId} />
            </div>
          </Row>
        ))}
      </Card>
    </section>
  ));
}

// SPEC 9.5: the confirmation step lists only the ticked entity IDs; Import comes back to External entities with its report.
export function ImportConfirm() {
  const [search] = useSearchParams();
  const selection = selectionOf(search);
  const port = useOverridesPort();
  const navigate = useNavigate();
  const settle = useSettle();
  const announce = useContext(ReportMessage);
  const preview = useLoad(importPath(selection), () => port.importPreview(selection));
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<number | null>(null);
  const back = externalPath({ set: selection.set });
  const count = preview.state === 'ready' ? preview.data.sources.reduce((sum, { entities }) => sum + entities.length, 0) : 0;
  const run = async () => {
    setBusy(true);
    setFailed(null);
    const result = await port.runImport(selection);
    setBusy(false);
    if (result.ok) {
      announce(headline(result.data, 'imported'), back, <CreationMessage report={result.data} verb="imported" />);
    } else {
      settle(result, setFailed);
    }
  };
  const bar = (
    <div className="save-bar">
      <div className="save-state" />
      <Button variant="quiet" onPress={() => void navigate(back)}>
        Back
      </Button>
      <Button variant="primary" disabled={count === 0} loading={busy} onPress={() => void run()}>
        {`Import ${number.format(count)}`}
      </Button>
    </div>
  );

  return (
    <Page width="slim" bar={bar}>
      <h1 className="h1">Import</h1>
      {failed !== null && <Callout kind="error" title={failureText('Not imported', failed)} />}
      {preview.state === 'failed' && <Callout kind="error" title={failureText('Not read', preview.status)} />}
      {preview.state === 'ready' && <Sources preview={preview.data} />}
    </Page>
  );
}
