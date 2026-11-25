import { LinkButton } from '../design-system/Button';
import { Empty } from '../design-system/Empty';
import { Page } from '../design-system/Page';
import { SP_LIST } from '../domain/entities';

// entityId: the object the request named; without it, the path itself names nothing.
export function NotFoundPage({ entityId }: { entityId?: string | undefined }) {
  return (
    <Page width="narrow">
      {entityId === undefined ? (
        <Empty state title="Not found" actions={<LinkButton to="/">Back to the Console</LinkButton>} />
      ) : (
        <Empty
          state
          title="Not found"
          text={
            <>
              No service provider has the entity ID <span className="mono wrap-any">{entityId}</span>
            </>
          }
          actions={<LinkButton to={SP_LIST}>Service providers</LinkButton>}
        />
      )}
    </Page>
  );
}
