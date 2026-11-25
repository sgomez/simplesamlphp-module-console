import { useContext } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { editPath, type EditedEntity } from '../domain/entities';
import { AddServiceProviderPage } from '../pages/AddServiceProviderPage';
import { EditServiceProviderPage } from '../pages/EditServiceProviderPage';
import { EntityListPage } from '../pages/EntityListPage';
import { PublishPage } from '../pages/PublishPage';
import { CARRY, ReportOutcome } from './Page';
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
  const announce = useContext(ReportOutcome);

  return (
    <Routes>
      <Route index element={<Navigate to={SP_LIST} replace state={CARRY} />} />
      <Route path={SP_LIST} element={<EntityListPage set="saml20-sp-remote" />} />
      <Route
        path={SP_NEW}
        element={
          <AddServiceProviderPage
            onSaved={onChange}
            onTitle={onTitle}
            onCreated={(entity) => announce({ created: entity }, editPath(entity.entityId))}
          />
        }
      />
      <Route
        path={SP_EDIT}
        element={<EditServiceProviderPage pending={pending} onSaved={onChange} onTitle={onTitle} created={created} />}
      />
      <Route path={PUBLISH} element={<PublishPage onChange={onChange} />} />
      <Route path="*" element={<Unknown />} />
    </Routes>
  );
}
