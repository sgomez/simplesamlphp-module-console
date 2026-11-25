import type { Failure } from '../domain/session';
import { PUBLISH, SP_EDIT, SP_LIST, SP_NEW } from './paths';
import type { Crumb } from './Shell';

// The trail after "Console"; title names the object of an edit screen.
export function crumbsOf(pathname: string, title: string): Crumb[] {
  switch (pathname) {
    case SP_LIST:
      return [{ label: 'Service providers' }];
    case PUBLISH:
      return [{ label: 'Publish' }];
    case SP_EDIT:
      return [{ label: 'Service providers', to: SP_LIST }, { label: title }];
    case SP_NEW:
      return [{ label: 'Service providers', to: SP_LIST }, { label: 'Add' }];
    default:
      return [];
  }
}

// A missing object keeps the list it belongs to in the trail.
export function failureCrumbs(failure: Failure): Crumb[] {
  if (failure.status === 403) {
    return [{ label: 'Request refused' }];
  }

  return failure.entityId === undefined
    ? [{ label: 'Not found' }]
    : [{ label: 'Service providers', to: SP_LIST }, { label: 'Not found' }];
}
