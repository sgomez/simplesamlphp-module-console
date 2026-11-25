import { createContext, useCallback, useContext } from 'react';
import { LinkButton } from '../components/ui/Button';
import { Empty } from '../components/ui/Empty';
import { SP_LIST } from './paths';

export type Failure = { status: 403 } | { status: 404; entityId?: string };

export const ReportFailure = createContext<(failure: Failure) => void>(() => undefined);

// True when the status is not the screen's to show: 401 reloads the page, 403 and 404 replace the screen.
export function useFailure(): (status: number, entityId?: string) => boolean {
  const report = useContext(ReportFailure);

  return useCallback(
    (status: number, entityId?: string) => {
      if (status === 403) {
        report({ status });
      } else if (status === 404) {
        report(entityId === undefined ? { status } : { status, entityId });
      }

      return status === 401 || status === 403 || status === 404;
    },
    [report],
  );
}

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
