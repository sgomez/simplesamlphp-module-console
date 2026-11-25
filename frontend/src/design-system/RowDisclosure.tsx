import type { ReactNode } from 'react';
import { Button, Disclosure, DisclosurePanel } from 'react-aria-components';

interface RowDisclosureProps {
  // The row's content; no control may sit inside it, since the whole row is the trigger.
  head: ReactNode;
  children: ReactNode;
}

// A row of a list card that unfolds its detail below it.
export function RowDisclosure({ head, children }: RowDisclosureProps) {
  return (
    <Disclosure className="grp grp-row">
      <Button slot="trigger">{head}</Button>
      <DisclosurePanel>
        <div className="grp-body">{children}</div>
      </DisclosurePanel>
    </Disclosure>
  );
}
