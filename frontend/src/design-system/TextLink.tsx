import type { MouseEvent, ReactNode } from 'react';
import { Link } from 'react-aria-components';
import type { LinkTarget } from './Button';
import { cx } from './classes';

// inherit: the colour of the text around it, as in a callout or a warning line.
type TextLinkProps = LinkTarget & {
  inherit?: boolean;
  className?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  children: ReactNode;
};

export function TextLink(props: TextLinkProps) {
  const className = cx('link', props.inherit && 'link-inherit', props.className);

  return props.to !== undefined ? (
    <Link className={className} href={props.to}>
      {props.children}
    </Link>
  ) : (
    <a className={className} href={props.href} onClick={props.onClick}>
      {props.children}
    </a>
  );
}
