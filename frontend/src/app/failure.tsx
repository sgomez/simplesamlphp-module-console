import type { Failure } from '../domain/session';
import { LinkButton } from '../design-system/Button';
import { Empty } from '../design-system/Empty';
import { SP_LIST } from './paths';

export interface Trail {
  crumb: string;
  parent?: { label: string; to: string };
}

export function failureTrail(failure: Failure): Trail {
  if (failure.status === 403) {
    return { crumb: 'Request refused' };
  }

  return failure.entityId === undefined
    ? { crumb: 'Not found' }
    : { crumb: 'Not found', parent: { label: 'Service providers', to: SP_LIST } };
}

const back = <LinkButton to="/">Back to the Console</LinkButton>;

export function FailurePage({ failure }: { failure: Failure }) {
  if (failure.status === 403) {
    return <Empty state title="Request refused" text="Nothing was saved." actions={back} />;
  }
  if (failure.entityId === undefined) {
    return <Empty state title="Not found" actions={back} />;
  }

  return (
    <Empty
      state
      title="Not found"
      text={
        <>
          No service provider has the entity ID <span className="mono wrap-any">{failure.entityId}</span>
        </>
      }
      actions={<LinkButton to={SP_LIST}>Service providers</LinkButton>}
    />
  );
}
