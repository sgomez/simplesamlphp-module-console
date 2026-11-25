import { Navigate, Route, Routes } from 'react-router';
import type { EditedEntity } from '../domain/entities';
import { AddServiceProvider } from '../screens/edit/AddServiceProvider';
import { EditServiceProvider } from '../screens/edit/EditServiceProvider';
import { Publish } from '../screens/Publish';
import { ServiceProvidersPage } from '../pages/ServiceProvidersPage';
import { CARRY } from './Page';
import { PUBLISH, SP_EDIT, SP_LIST, SP_NEW } from './paths';
import { Unknown } from './Unknown';

interface ScreensProps {
  pending: number;
  // A save or a Publication changed what the session answers.
  onChange: () => void;
  onTitle: (title: string) => void;
  // The entity a create has just answered, which its edit screen shows as saved.
  created: EditedEntity | null;
}

export function Screens({ pending, onChange, onTitle, created }: ScreensProps) {
  return (
    <Routes>
      <Route index element={<Navigate to={SP_LIST} replace state={CARRY} />} />
      <Route path={SP_LIST} element={<ServiceProvidersPage />} />
      <Route
        path={SP_NEW}
        element={<AddServiceProvider pending={pending} onSaved={onChange} onTitle={onTitle} />}
      />
      <Route
        path={SP_EDIT}
        element={<EditServiceProvider pending={pending} onSaved={onChange} onTitle={onTitle} created={created} />}
      />
      <Route path={PUBLISH} element={<Publish onChange={onChange} />} />
      <Route path="*" element={<Unknown />} />
    </Routes>
  );
}
