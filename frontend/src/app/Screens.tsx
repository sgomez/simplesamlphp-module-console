import { useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import type { EditedEntity } from '../api/types';
import { AddServiceProvider } from '../screens/edit/AddServiceProvider';
import { EditServiceProvider } from '../screens/edit/EditServiceProvider';
import { Publish } from '../screens/Publish';
import { ServiceProviders } from '../screens/ServiceProviders';
import { editPath, PUBLISH, SP_EDIT, SP_LIST, SP_NEW } from './paths';
import { Unknown } from './Unknown';

interface ScreensProps {
  pending: number;
  // A save or a Publication changed what the session answers.
  onChange: () => void;
  onTitle: (title: string) => void;
}

// The entity a create answered: its edit screen, once the create has moved there, shows it; leaving that ends it.
interface Created {
  entity: EditedEntity;
  at: string | null;
}

function useCreated() {
  const { key, pathname, search } = useLocation();
  const [created, setCreated] = useState<Created | null>(null);
  const arrived = created !== null && pathname + search === editPath(created.entity.entityId);

  // Adjusted while rendering, so the move that ends it never shows it on the next screen.
  if (created !== null && created.at === null && arrived) {
    setCreated({ ...created, at: key });
  } else if (created !== null && created.at !== null && created.at !== key) {
    setCreated(null);
  }
  const shown = created?.at === key ? created.entity : null;

  return [shown, (entity: EditedEntity) => setCreated({ entity, at: null })] as const;
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
