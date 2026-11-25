import { LinkButton } from '../components/ui/Button';
import { plural } from './counts';
import { PUBLISH } from './paths';

// global: the header's button; secondary: the one inside a callout.
export function ReviewChanges({ count, variant }: { count: number; variant: 'global' | 'secondary' }) {
  return (
    <LinkButton variant={variant} small to={PUBLISH}>
      <span className="dot dot-half" aria-hidden="true" />
      {`Review ${plural(count, 'change', 'changes')}`}
    </LinkButton>
  );
}
