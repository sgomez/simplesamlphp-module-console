import { useContext, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../design-system/Button';
import { Callout } from '../../design-system/Callout';
import { Card } from '../../design-system/Card';
import { Check } from '../../design-system/Check';
import { Chip } from '../../design-system/Chip';
import { Eid } from '../../design-system/Eid';
import { Page } from '../../design-system/Page';
import { Row } from '../../design-system/Row';
import { failureText } from '../../lib/failureText';
import { listRoute, SET_WORDS, type EntitySet } from '../entities';
import { ReportMessage, useSettle } from '../session';
import { CreationMessage, headline } from './CreationMessage';
import { formatLabels } from './detect';
import { useHold, type Held } from './hold';
import { addPath, usePastedPort } from './port';
import type { Candidate, Reading } from './types';

const BECOMES = { override: 'Becomes an Override', shadowed: 'Becomes Shadowed' } as const;

function End({ candidate }: { candidate: Candidate }) {
  if (candidate.managed) {
    return <Chip>Managed</Chip>;
  }

  return candidate.collision && <span className="small muted">{BECOMES[candidate.collision]}</span>;
}

type SeveralHeld = Held & { reading: Extract<Reading, { kind: 'several' }> };

// SPEC 9.6 (AddSeveral): entities already managed cannot be picked; one picked opens in review, several are created.
export function PickSeveral({ set, held }: { set: EntitySet; held: SeveralHeld }) {
  const { candidates } = held.reading;
  const port = usePastedPort();
  const navigate = useNavigate();
  const settle = useSettle();
  const announce = useContext(ReportMessage);
  const [picked, setPicked] = useState(() => candidates.filter((c) => !c.managed).map((c) => c.entityId));
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<number | null>(null);
  const { hold } = useHold();
  const review = async () => {
    setBusy(true);
    const result = await port.read({ kind: 'entity', set }, held.text, held.format, picked[0]);
    setBusy(false);
    if (result.ok) {
      hold({ ...held, at: addPath(set, '/review'), reading: result.data });
      void navigate(addPath(set, '/review'));
    } else {
      settle(result, setFailed);
    }
  };
  const create = async () => {
    setBusy(true);
    const result = await port.createSeveral(set, held.text, held.format, picked);
    setBusy(false);
    if (result.ok) {
      announce(headline(result.data, 'created'), listRoute(set), <CreationMessage report={result.data} verb="created" />);
    } else {
      settle(result, setFailed);
    }
  };
  const count = picked.length;
  const bar = (
    <div className="save-bar">
      <div className="save-state">{count > 0 && <span className="is-strong">{`${count} selected`}</span>}</div>
      <Button variant="quiet" onPress={() => void navigate(addPath(set))}>
        Back
      </Button>
      <Button variant="primary" disabled={count === 0} loading={busy} onPress={() => void (count === 1 ? review() : create())}>
        {count === 1 ? 'Review' : `Create ${count}`}
      </Button>
    </div>
  );

  return (
    <Page width="slim" bar={bar}>
      <h1 className="h1">{`Add ${SET_WORDS[set].many}`}</h1>
      <span className="small muted">{formatLabels(held.text)[held.format]}</span>
      {failed !== null && <Callout kind="error" title={failureText(count === 1 ? 'Not read' : 'Not saved', failed)} />}
      <Card list>
        {candidates.map((candidate) => (
          <Row key={candidate.entityId} plain className="row-wrap pick-row">
            <Check
              label={`Select ${candidate.name ?? candidate.entityId}`}
              hideLabel
              disabled={candidate.managed}
              checked={picked.includes(candidate.entityId)}
              onChange={(on) => setPicked(on ? [...picked, candidate.entityId] : picked.filter((id) => id !== candidate.entityId))}
            />
            <div className="row-main">
              {candidate.name !== null && <span className="row-name">{candidate.name}</span>}
              <Eid id={candidate.entityId} />
            </div>
            <End candidate={candidate} />
          </Row>
        ))}
      </Card>
    </Page>
  );
}
