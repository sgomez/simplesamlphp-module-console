import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigationType } from 'react-router';
import type { DatabaseRefusal, MigrationRun, Session } from '../api/types';
import { RunMessage } from '../screens/RunMessage';
import { ServiceProviders } from '../screens/ServiceProviders';
import { StatePage, stateCrumb } from '../screens/StatePage';
import { FailurePage, failureTrail, ReportFailure, useFailure, type Failure } from './failure';
import { SP_LIST } from './paths';
import { refusalOf, ReportRefusal } from './refusals';
import { Shell } from './Shell';
import { useApi } from './useApi';

const crumbs: Record<string, string> = { [SP_LIST]: 'Service providers' };

function Unknown() {
  const fail = useFailure();
  useLayoutEffect(() => {
    fail(404);
  }, [fail]);

  return null;
}

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
  const answer = useApi<Session>('/session');
  const [reported, setReported] = useState<DatabaseRefusal | null>(null);
  const { pathname, key } = useLocation();
  const navigation = useNavigationType();
  const [failed, setFailed] = useState<{ key: string; failure: Failure } | null>(null);
  const report = useCallback((failure: Failure) => setFailed({ key, failure }), [key]);
  const failure = failed?.key === key ? failed.failure : null;
  const refusal = reported ?? (answer.state === 'failed' ? refusalOf(answer.status, answer.body) : null);
  const run = outcome !== null && (outcome.at === key || navigation === 'REPLACE') ? outcome.run : null;

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
      <Shell session={refusal?.session ?? session} pending={pending} crumb={crumb} parent={parent} narrow>
        {message}
        <FailurePage failure={failure} />
      </Shell>
    );
  }
  if (refusal) {
    return (
      <Shell session={refusal.session} pending={0} crumb={stateCrumb(refusal)} narrow>
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
      </Shell>
    );
  }

  // The screen waits for the state check, so it never shows before the state page that replaces it.
  return (
    <Shell session={session} pending={pending} crumb={crumbs[pathname]}>
      {message}
      {answer.state !== 'loading' && (
        <ReportRefusal value={setReported}>
          <ReportFailure value={report}>
            <Routes>
              <Route index element={<Navigate to={SP_LIST} replace />} />
              <Route path={SP_LIST} element={<ServiceProviders />} />
              <Route path="*" element={<Unknown />} />
            </Routes>
          </ReportFailure>
        </ReportRefusal>
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
