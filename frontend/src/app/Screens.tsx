import { Navigate, Route, Routes } from 'react-router';
import { EditServiceProvider } from '../screens/edit/EditServiceProvider';
import { Publish } from '../screens/Publish';
import { ServiceProviders } from '../screens/ServiceProviders';
import { PUBLISH, SP_EDIT, SP_LIST } from './paths';
import { Unknown } from './Unknown';

interface ScreensProps {
  pending: number;
  // A save or a Publication changed what the session answers.
  onChange: () => void;
  onTitle: (title: string) => void;
}

export function Screens({ pending, onChange, onTitle }: ScreensProps) {
  return (
    <Routes>
      <Route index element={<Navigate to={SP_LIST} replace />} />
      <Route path={SP_LIST} element={<ServiceProviders />} />
      <Route path={SP_EDIT} element={<EditServiceProvider pending={pending} onSaved={onChange} onTitle={onTitle} />} />
      <Route path={PUBLISH} element={<Publish onChange={onChange} />} />
      <Route path="*" element={<Unknown />} />
    </Routes>
  );
}
