import type { ReactNode } from 'react';
import { Button, Disclosure as AriaDisclosure, DisclosurePanel } from 'react-aria-components';

interface DisclosureProps {
  summary: string;
  // A card of its own, as the warnings on Publish, rather than a fold inside another surface.
  card?: boolean;
  defaultExpanded?: boolean;
  children: ReactNode;
}

export function Disclosure({ summary, card, defaultExpanded = false, children }: DisclosureProps) {
  return (
    <AriaDisclosure className={card ? 'grp card' : 'grp'} defaultExpanded={defaultExpanded}>
      <Button slot="trigger">
        <span className={card ? 'row-name' : 'small'}>{summary}</span>
      </Button>
      <DisclosurePanel>{card ? <div className="grp-body">{children}</div> : children}</DisclosurePanel>
    </AriaDisclosure>
  );
}
