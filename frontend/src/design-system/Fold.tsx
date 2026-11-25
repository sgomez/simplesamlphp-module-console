import type { ReactNode } from 'react';
import { Button, Disclosure, DisclosurePanel } from 'react-aria-components';

interface FoldProps {
  // The row's cells, shown folded or not.
  summary: ReactNode;
  defaultExpanded?: boolean;
  children: ReactNode;
}

// A row of a card that opens in place, as on the Audit trail.
export function Fold({ summary, defaultExpanded = false, children }: FoldProps) {
  return (
    <Disclosure className="grp fold" defaultExpanded={defaultExpanded}>
      <Button slot="trigger">{summary}</Button>
      <DisclosurePanel>
        <div className="grp-body">{children}</div>
      </DisclosurePanel>
    </Disclosure>
  );
}
