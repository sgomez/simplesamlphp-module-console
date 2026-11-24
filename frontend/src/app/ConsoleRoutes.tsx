import { Navigate, Route, Routes, useLocation } from 'react-router';
import type { Session } from '../api/types';
import { ServiceProviders } from '../screens/ServiceProviders';
import { SP_LIST } from './paths';
import { Shell } from './Shell';
import { useApi } from './useApi';

const crumbs: Record<string, string> = { [SP_LIST]: 'Service providers' };

export function ConsoleRoutes() {
  const session = useApi<Session>('/session');
  const { pathname } = useLocation();

  return (
    <Shell session={session} crumb={crumbs[pathname]}>
      <Routes>
        <Route index element={<Navigate to={SP_LIST} replace />} />
        <Route path={SP_LIST} element={<ServiceProviders />} />
        <Route path="*" element={null} />
      </Routes>
    </Shell>
  );
}
