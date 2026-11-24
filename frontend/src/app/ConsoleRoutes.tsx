import { useCallback, useLayoutEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import type { Session } from '../api/types';
import { ServiceProviders } from '../screens/ServiceProviders';
import { FailurePage, failureTrail, ReportFailure, useFailure, type Failure } from './failure';
import { SP_LIST } from './paths';
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

export function ConsoleRoutes() {
  const answer = useApi<Session>('/session');
  const session = answer.state === 'ready' ? answer.data : null;
  const { pathname, key } = useLocation();
  const [failed, setFailed] = useState<{ key: string; failure: Failure } | null>(null);
  const report = useCallback((failure: Failure) => setFailed({ key, failure }), [key]);
  const failure = failed?.key === key ? failed.failure : null;

  if (failure !== null) {
    const { crumb, parent } = failureTrail(failure);

    return (
      <Shell session={session} crumb={crumb} parent={parent} narrow>
        <FailurePage failure={failure} />
      </Shell>
    );
  }

  return (
    <Shell session={session} crumb={crumbs[pathname]}>
      <ReportFailure value={report}>
        <Routes>
          <Route index element={<Navigate to={SP_LIST} replace />} />
          <Route path={SP_LIST} element={<ServiceProviders />} />
          <Route path="*" element={<Unknown />} />
        </Routes>
      </ReportFailure>
    </Shell>
  );
}
