import type { ReactNode } from 'react';
import { Button, Disclosure, DisclosurePanel } from 'react-aria-components';
import { ErrorIcon } from './icons';

interface CollapsibleProps {
  // The anchor of the card on the page.
  id: string;
  title: string;
  // Beside the title, such as "2 of 5 set".
  meta?: string;
  errors?: number;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  children: ReactNode;
}

// A card that folds, headed by its title.
export function Collapsible({ id, title, meta, errors = 0, expanded, onExpandedChange, children }: CollapsibleProps) {
  return (
    <div id={id}>
      <Disclosure className="grp card" isExpanded={expanded} onExpandedChange={onExpandedChange}>
      <Button slot="trigger">
        <span className="h3">{title}</span>
        {meta && <span className="small muted">{meta}</span>}
        {errors > 0 && (
          <span className="status s-danger grp-errors">
            <ErrorIcon />
            {errors === 1 ? '1 error' : `${errors} errors`}
          </span>
        )}
      </Button>
      <DisclosurePanel>{children}</DisclosurePanel>
      </Disclosure>
    </div>
  );
}
