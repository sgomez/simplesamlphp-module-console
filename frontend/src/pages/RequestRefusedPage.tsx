import { LinkButton } from '../design-system/Button';
import { Empty } from '../design-system/Empty';
import { Page } from '../design-system/Page';

export function RequestRefusedPage() {
  return (
    <Page width="narrow">
      <Empty state title="Request refused" text="Nothing was saved." actions={<LinkButton to="/">Back to the Console</LinkButton>} />
    </Page>
  );
}
