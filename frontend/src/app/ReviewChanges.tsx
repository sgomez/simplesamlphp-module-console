import { LinkButton } from '../design-system/Button';
import { Narrow, Wide } from '../design-system/Responsive';
import { plural } from '../lib/plural';
import { PUBLISH } from './paths';

// global: the header's button, the count alone at phone width; secondary: the one inside a callout.
export function ReviewChanges({ count, variant }: { count: number; variant: 'global' | 'secondary' }) {
  const text = `Review ${plural(count, 'change', 'changes')}`;

  return (
    <LinkButton variant={variant} small to={PUBLISH} {...(variant === 'global' ? { label: text } : {})}>
      <span className="dot dot-half" aria-hidden="true" />
      {variant === 'global' ? (
        <>
          <Wide>{text}</Wide>
          <Narrow>{count}</Narrow>
        </>
      ) : (
        text
      )}
    </LinkButton>
  );
}
