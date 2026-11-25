import { LinkButton } from '../../design-system/Button';
import { Callout } from '../../design-system/Callout';
import { Card } from '../../design-system/Card';
import { Empty } from '../../design-system/Empty';
import { ChevronIcon, SuccessIcon } from '../../design-system/icons';
import { Row } from '../../design-system/Row';
import { Status } from '../../design-system/Status';
import { TextLink } from '../../design-system/TextLink';
import { failureText } from '../../lib/failureText';
import { when } from '../../lib/time';
import { SP_NEW } from '../entities';
import { EXTERNAL } from '../overrides';
import { HISTORY } from '../publication';
import { lineOf } from './attention';
import type { Attention, PublishedSnapshot } from './port';
import type { OverviewState } from './useOverview';

function NeedsAttention({ attention }: { attention: Attention[] }) {
  const rows = attention.map(lineOf).map(({ tone, mark, text, to }) => (
    <Row key={text} to={to}>
      <span className="row-main">
        <Status tone={tone} mark={mark}>
          {text}
        </Status>
      </span>
      <ChevronIcon />
    </Row>
  ));

  return (
    <section className="sect">
      <div className="sect-head">
        <h2 className="h2">Needs attention</h2>
      </div>
      <Card list>
        {rows.length > 0 ? (
          rows
        ) : (
          <Row plain>
            <SuccessIcon className="ic ic-success" />
            <span>Nothing</span>
          </Row>
        )}
      </Card>
    </section>
  );
}

function Live({ current }: { current: PublishedSnapshot | null }) {
  return (
    <section className="sect">
      <div className="sect-head">
        <h2 className="h2">Live</h2>
      </div>
      <Card className="live-card">
        {current === null ? (
          <span className="small muted">Nothing published yet</span>
        ) : (
          <>
            <Status tone="live" mark="full">{`Snapshot #${current.number}`}</Status>
            <span className="small muted">
              {`Published ${when(current.createdAt)} by `}
              <span className="mono">{current.createdBy}</span>
            </span>
            {current.comment !== null && <span className="small">{current.comment}</span>}
            <TextLink to={HISTORY} className="small">
              History and rollback
            </TextLink>
          </>
        )}
      </Card>
    </section>
  );
}

// SPEC 10.7: first run, all clear, or things to do.
export function OverviewView({ overview }: { overview: OverviewState }) {
  const { answer, firstRun } = overview;
  if (answer.state === 'loading') {
    return null;
  }
  if (answer.state === 'failed') {
    return <Callout kind="error" title={failureText('Overview not loaded', answer.status)} />;
  }
  if (firstRun) {
    const actions = (
      <>
        <LinkButton variant="primary" to={SP_NEW}>
          Add a service provider
        </LinkButton>
        <LinkButton to={EXTERNAL}>Import existing entities</LinkButton>
      </>
    );

    return <Empty title="Nothing is managed yet" actions={actions} />;
  }

  return (
    <>
      <NeedsAttention attention={answer.data.attention} />
      <Live current={answer.data.current} />
    </>
  );
}
