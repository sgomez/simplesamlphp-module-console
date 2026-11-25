import { useCallback, useLayoutEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import { postJson } from '../api/client';
import type { DatabaseRefusal, MigrationRun, Session } from '../api/types';
import { Callout } from '../components/ui/Callout';
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

// The outcome of Run migrations, shown once, on the screen the run was started from.
interface Outcome {
  at: string;
  run: MigrationRun;
}

function RunMessage({ run }: { run: MigrationRun }) {
  if (run.outcome === 'Concurrent') {
    return <Callout kind="warning" title={run.reason ?? ''} />;
  }

  return run.applied.length === 0 ? (
    <Callout kind="info" title="The database schema is already up to date." />
  ) : (
    <Callout kind="success" title={`Migrations applied: ${run.applied.join(', ')}.`} />
  );
}

interface ConsoleProps {
  outcome: Outcome | null;
  onRun: (run: MigrationRun, at: string) => void;
}

function Console({ outcome, onRun }: ConsoleProps) {
  const answer = useApi<Session>('/session');
  const [reported, setReported] = useState<DatabaseRefusal | null>(null);
  const [running, setRunning] = useState(false);
  const { pathname, key } = useLocation();
  const [failed, setFailed] = useState<{ key: string; failure: Failure } | null>(null);
  const report = useCallback((failure: Failure) => setFailed({ key, failure }), [key]);
  const failure = failed?.key === key ? failed.failure : null;
  const refusal = (answer.state === 'failed' ? refusalOf(answer.status, answer.body) : null) ?? reported;
  const run = outcome?.at === key ? outcome.run : null;

  if (refusal) {
    const update = () => {
      setRunning(true);
      void postJson<MigrationRun>('/migrate', {}).then((result) => {
        if (result.ok) {
          onRun(result.data, key);
        } else {
          setRunning(false);
        }
      });
    };

    return (
      <Shell session={refusal.session} pending={0} crumb={stateCrumb(refusal)} narrow>
        {run && run.outcome !== 'Failed' && <RunMessage run={run} />}
        <StatePage
          refusal={refusal}
          failure={run?.outcome === 'Failed' ? run : null}
          running={running}
          onUpdate={update}
        />
      </Shell>
    );
  }
  const session = answer.state === 'ready' ? answer.data : null;
  const pending = session?.pendingCount ?? 0;

  if (failure !== null) {
    const { crumb, parent } = failureTrail(failure);

    return (
      <Shell session={session} pending={pending} crumb={crumb} parent={parent} narrow>
        <FailurePage failure={failure} />
      </Shell>
    );
  }

  // The screen waits for the state check, so it never shows before the state page that replaces it.
  return (
    <Shell session={session} pending={pending} crumb={crumbs[pathname]}>
      {run && <RunMessage run={run} />}
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

  return (
    <Console
      key={round}
      outcome={outcome}
      onRun={(run, at) => {
        setOutcome({ at, run });
        setRound(round + 1);
      }}
    />
  );
}
