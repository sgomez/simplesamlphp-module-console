import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router';
import type { DatabaseRefusal, MigrationRun, Session } from '../api/types';
import { RunMessage } from '../screens/RunMessage';
import { StatePage, stateCrumb } from '../screens/StatePage';
import { FailurePage, failureTrail, ReportFailure, type Failure } from './failure';
import { LiveSnapshot } from './LiveSnapshot';
import { Page, PageNotice } from './Page';
import { crumbsOf } from './crumbs';
import { PUBLISH } from './paths';
import { refusalOf, ReportRefusal } from './refusals';
import { Screens } from './Screens';
import { Shell } from './Shell';
import { useApi } from './useApi';

// The outcome of Run migrations and the location it is shown at; redirects carry it along, the admin's next move ends it.
interface Outcome {
  at: string;
  run: MigrationRun;
}

interface ConsoleProps {
  outcome: Outcome | null;
  onRun: (run: MigrationRun, at: string) => void;
  onMove: (at: string | null) => void;
}

function Console({ outcome, onRun, onMove }: ConsoleProps) {
  const [revision, setRevision] = useState(0);
  const answer = useApi<Session>('/session', { revision });
  const [reported, setReported] = useState<DatabaseRefusal | null>(null);
  const { pathname, search, key } = useLocation();
  const navigation = useNavigationType();
  const [failed, setFailed] = useState<{ key: string; failure: Failure } | null>(null);
  const report = useCallback((failure: Failure) => setFailed({ key, failure }), [key]);
  const failure = failed?.key === key ? failed.failure : null;
  const refusal = reported ?? (answer.state === 'failed' ? refusalOf(answer.status, answer.body) : null);
  const run = outcome !== null && (outcome.at === key || navigation === 'REPLACE') ? outcome.run : null;
  const at = pathname + search;
  const [title, setTitle] = useState<{ at: string; text: string } | null>(null);
  const onTitle = useCallback((text: string) => setTitle({ at, text }), [at]);
  const changed = useCallback(() => setRevision((n) => n + 1), []);
  const shown = title?.at === at ? title.text : (new URLSearchParams(search).get('entityid') ?? '');

  useEffect(() => {
    if (outcome !== null && outcome.at !== key) {
      onMove(navigation === 'REPLACE' ? key : null);
    }
  }, [outcome, key, navigation, onMove]);

  const session = answer.state === 'ready' ? answer.data : null;
  const pending = session?.pendingCount ?? 0;
  const message = run && <RunMessage run={run} />;

  if (failure !== null) {
    const { crumb, parent } = failureTrail(failure);

    return (
      <Shell session={refusal?.session ?? session} pending={pending} crumbs={[...(parent ? [parent] : []), { label: crumb }]}>
        <Page narrow>
          {message}
          <FailurePage failure={failure} />
        </Page>
      </Shell>
    );
  }
  if (refusal) {
    return (
      <Shell session={refusal.session} pending={0} crumbs={[{ label: stateCrumb(refusal) }]}>
        <Page narrow>
          {message}
          <ReportFailure value={report}>
            <StatePage
              refusal={refusal}
              flush={run !== null}
              failedAt={run?.outcome === 'Failed' ? (run.failed?.number ?? null) : null}
              onRun={(done) => onRun(done, key)}
              onRefused={setReported}
            />
          </ReportFailure>
        </Page>
      </Shell>
    );
  }

  // On Publish the header shows the current Snapshot instead of the Review button (SPEC 10.3).
  const live = session?.current ? <LiveSnapshot current={session.current} /> : null;

  // The screen waits for the state check, so it never shows before the state page that replaces it.
  return (
    <Shell
      session={session}
      pending={pending}
      crumbs={crumbsOf(pathname, shown)}
      {...(pathname === PUBLISH ? { end: live } : {})}
    >
      {answer.state !== 'loading' && (
        <PageNotice value={message}>
          <ReportRefusal value={setReported}>
            <ReportFailure value={report}>
              <Screens pending={pending} onChange={changed} onTitle={onTitle} />
            </ReportFailure>
          </ReportRefusal>
        </PageNotice>
      )}
    </Shell>
  );
}

export function ConsoleRoutes() {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [round, setRound] = useState(0);
  const move = useCallback(
    (at: string | null) => setOutcome((current) => (current === null || at === null ? null : { ...current, at })),
    [],
  );

  return (
    <Console
      key={round}
      outcome={outcome}
      onRun={(run, at) => {
        setOutcome({ at, run });
        setRound(round + 1);
      }}
      onMove={move}
    />
  );
}
