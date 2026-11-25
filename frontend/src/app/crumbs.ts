import { PUBLISH, SP_EDIT, SP_LIST } from './paths';
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
    default:
      return [];
  }
}
