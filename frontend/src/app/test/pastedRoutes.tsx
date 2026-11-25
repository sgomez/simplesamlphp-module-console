import { AUTHSOURCE_NEW, AUTHSOURCES } from '../../domain/authsources';
import { editPath, listRoute, SET_WORDS, SP_EDIT, SP_LIST, type EntitySet } from '../../domain/entities';
import { EXTERNAL, IMPORT } from '../../domain/overrides';
import { addPath, AUTHSOURCE_REVIEW } from '../../domain/pasted';
import { AddFromPastePage, AddSeveralPage, PastedReviewPage } from '../../pages/AddFromPastePage';
import { EditServiceProviderPage } from '../../pages/EditServiceProviderPage';
import { ImportPage } from '../../pages/ImportPage';
import { ManagedCopyPage } from '../../pages/ManagedCopyPage';
import { ReplaceFromPage, ReplaceReviewPage } from '../../pages/ReplaceFromPage';
import { ReviewAuthsourcePage } from '../../pages/ReviewAuthsourcePage';
import { MOODLE } from '../adapters/memory/edited';
import type { Crumb } from '../Shell';
import type { StoryRoute } from './storyRoutes';

const SETS = Object.keys(SET_WORDS) as EntitySet[];
const at = (...crumbs: Crumb[]) => () => crumbs;
const noop = () => undefined;

function named(search: URLSearchParams): Crumb {
  const entityId = search.get('entityid') ?? '';

  return { label: entityId === MOODLE ? 'Moodle' : entityId, to: editPath(entityId) };
}

// The steps of creating from pasted configuration, of "Replace from…" and of Import (SPEC 9.5 to 9.7).
export function pastedRoutes(external: (search: URLSearchParams, set: string | undefined) => Crumb[]): StoryRoute[] {
  return [
    ...SETS.flatMap((set) => {
      const list = { label: SET_WORDS[set].title, to: listRoute(set) };

      return [
        { path: addPath(set), crumbs: at(list, { label: 'Add' }), page: <AddFromPastePage key={set} set={set} />, set },
        { path: addPath(set, '/review'), crumbs: at(list, { label: 'Add', to: addPath(set) }, { label: 'Review' }), page: <PastedReviewPage set={set} />, set },
        { path: addPath(set, '/several'), crumbs: at(list, { label: 'Add' }), page: <AddSeveralPage set={set} />, set },
      ];
    }),
    {
      path: `${SP_LIST}/replace`,
      crumbs: (search) => [{ label: 'Service providers', to: SP_LIST }, named(search), { label: 'Replace' }],
      page: <ReplaceFromPage set="saml20-sp-remote" />,
    },
    {
      path: `${SP_LIST}/replace/review`,
      crumbs: (search) => [{ label: 'Service providers', to: SP_LIST }, named(search), { label: 'Replace' }],
      page: <ReplaceReviewPage set="saml20-sp-remote" />,
    },
    {
      path: SP_EDIT,
      crumbs: (search) => [{ label: 'Service providers', to: SP_LIST }, { label: named(search).label }],
      page: <EditServiceProviderPage pending={7} created={null} onSaved={noop} onTitle={noop} />,
    },
    { path: IMPORT, crumbs: at({ label: 'External entities', to: EXTERNAL }, { label: 'Import' }), page: <ImportPage /> },
    { path: `${EXTERNAL}/:set/copy`, crumbs: (search, set) => [...external(search, set), { label: 'Copy' }], page: <ManagedCopyPage /> },
    {
      path: AUTHSOURCE_REVIEW,
      crumbs: at({ label: 'Authsources', to: AUTHSOURCES }, { label: 'Add', to: AUTHSOURCE_NEW }, { label: 'Review' }),
      page: <ReviewAuthsourcePage />,
    },
  ];
}
