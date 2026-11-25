import type { ReactNode } from 'react';
import { AUTHSOURCE_NEW, AUTHSOURCES } from '../../domain/authsources';
import { editPath, listRoute, SET_WORDS, SP_LIST, type EntitySet } from '../../domain/entities';
import { NODES } from '../../domain/nodes';
import { EXTERNAL } from '../../domain/overrides';
import { AUDIT, HISTORY } from '../../domain/publication';
import { AddAuthsourcePage } from '../../pages/AddAuthsourcePage';
import { AuditPage } from '../../pages/AuditPage';
import { AuthsourcesPage } from '../../pages/AuthsourcesPage';
import { EntityListPage } from '../../pages/EntityListPage';
import { ExternalEntityPage } from '../../pages/ExternalEntityPage';
import { ExternalPage } from '../../pages/ExternalPage';
import { HistoryPage } from '../../pages/HistoryPage';
import { NodesPage } from '../../pages/NodesPage';
import { OverridePage } from '../../pages/OverridePage';
import { OverviewPage } from '../../pages/OverviewPage';
import { RollbackPage } from '../../pages/RollbackPage';
import { copiesOf, type SourceFixture } from '../adapters/memory/external';
import { boardComparison } from '../adapters/memory/overrides';
import type { Crumb } from '../Shell';
import { pastedRoutes } from './pastedRoutes';

export interface StoryRoute {
  path: string;
  crumbs: (search: URLSearchParams, set: string | undefined) => Crumb[];
  page: ReactNode;
  // The set whose entities the page lists.
  set?: EntitySet;
}

const SETS = Object.keys(SET_WORDS) as EntitySet[];
const compared = boardComparison.name ?? boardComparison.entityId;
const at = (...crumbs: Crumb[]) => () => crumbs;

// The screens SPEC specifies that the server does not serve yet; sources name the External entities' crumb.
export function storyRoutes(sources: SourceFixture[]): StoryRoute[] {
  const external = (search: URLSearchParams, set: string | undefined): Crumb[] => {
    const entityId = search.get('entityid') ?? '';

    return [{ label: 'External entities', to: EXTERNAL }, { label: copiesOf(sources, set as EntitySet, entityId).name ?? entityId }];
  };

  return [
    { path: '/', crumbs: at({ label: 'Overview' }), page: <OverviewPage /> },
    ...SETS.map((set) => ({ path: listRoute(set), crumbs: at({ label: SET_WORDS[set].title }), page: <EntityListPage key={set} set={set} />, set })),
    { path: EXTERNAL, crumbs: at({ label: 'External entities' }), page: <ExternalPage /> },
    { path: `${EXTERNAL}/:set`, crumbs: external, page: <ExternalEntityPage /> },
    { path: AUTHSOURCES, crumbs: at({ label: 'Authsources' }), page: <AuthsourcesPage /> },
    { path: AUTHSOURCE_NEW, crumbs: at({ label: 'Authsources', to: AUTHSOURCES }, { label: 'Add' }), page: <AddAuthsourcePage /> },
    { path: HISTORY, crumbs: at({ label: 'History' }), page: <HistoryPage /> },
    { path: AUDIT, crumbs: at({ label: 'History' }), page: <AuditPage /> },
    { path: `${HISTORY}/:n/rollback`, crumbs: at({ label: 'History', to: HISTORY }, { label: 'Roll back' }), page: <RollbackPage /> },
    { path: NODES, crumbs: at({ label: 'Nodes' }), page: <NodesPage /> },
    {
      path: `${SP_LIST}/override`,
      crumbs: at({ label: 'Service providers', to: SP_LIST }, { label: compared, to: editPath(boardComparison.entityId) }, { label: 'Compare' }),
      page: <OverridePage />,
    },
    ...pastedRoutes(external),
  ];
}
