import { useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import type { EditedEntity } from '../api/types';
import { AddServiceProvider } from '../screens/edit/AddServiceProvider';
import { EditServiceProvider } from '../screens/edit/EditServiceProvider';
import { Publish } from '../screens/Publish';
import { ServiceProviders } from '../screens/ServiceProviders';
import { PUBLISH, SP_EDIT, SP_LIST, SP_NEW } from './paths';
import { Unknown } from './Unknown';

interface ScreensProps {
  pending: number;
  // A save or a Publication changed what the session answers.
  onChange: () => void;
  onTitle: (title: string) => void;
}

// The entity a create answered, from the location it was created at; the next location shows it, leaving that ends it.
interface Created {
  entity: EditedEntity;
  from: string;
  at: string | null;
}

function useCreated() {
  const { key } = useLocation();
  const [created, setCreated] = useState<Created | null>(null);

  // Adjusted while rendering, so the move that ends it never shows it on the next screen.
  if (created !== null && created.from !== key && created.at !== key) {
    setCreated(created.at === null ? { ...created, at: key } : null);
  }
  const shown = created !== null && created.at === key ? created.entity : null;

  return [shown, (entity: EditedEntity) => setCreated({ entity, from: key, at: null })] as const;
}

export function Screens({ pending, onChange, onTitle }: ScreensProps) {
  const [created, onCreated] = useCreated();

  return (
    <Routes>
      <Route index element={<Navigate to={SP_LIST} replace />} />
      <Route path={SP_LIST} element={<ServiceProviders />} />
      <Route
        path={SP_NEW}
        element={<AddServiceProvider pending={pending} onSaved={onChange} onTitle={onTitle} onCreated={onCreated} />}
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
