import { Fragment, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import type { SessionLinks } from '../api/types';
import { Button, LinkButton } from '../components/ui/Button';
import { MenuIcon } from '../components/ui/icons';
import { PUBLISH } from './paths';
import { Sidebar } from './Sidebar';

export interface Crumb {
  label: string;
  to?: string;
}

interface ShellProps {
  session: SessionLinks | null;
  pending: number;
  crumbs: readonly Crumb[];
  // The end of the header; the Review button when not given.
  end?: ReactNode;
  children: ReactNode;
}

function Review({ count }: { count: number }) {
  return (
    <LinkButton variant="global" small to={PUBLISH}>
      <span className="dot dot-half" aria-hidden="true" />
      {`Review ${count} ${count === 1 ? 'change' : 'changes'}`}
    </LinkButton>
  );
}

export function Shell({ session, pending, crumbs, end, children }: ShellProps) {
  const { key } = useLocation();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === key;

  return (
    <div className="shell">
      <div id="nav" className={open ? 'shell-side is-open' : 'shell-side'}>
        <Sidebar session={session} pending={pending} />
      </div>
      <div className="shell-main">
        <header className="shell-head">
          <Button menu iconOnly label="Menu" controls="nav" expanded={open} onClick={() => setOpenAt(open ? null : key)}>
            <MenuIcon />
          </Button>
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link className="crumb" to="/">
              Console
            </Link>
            {crumbs.map(({ label, to }, index) => (
              <Fragment key={index}>
                <span aria-hidden="true" className="faint">
                  /
                </span>
                {to === undefined ? (
                  <span aria-current="page" className="crumb-current">
                    {label}
                  </span>
                ) : (
                  <Link className="crumb" to={to}>
                    {label}
                  </Link>
                )}
              </Fragment>
            ))}
          </nav>
          {end === undefined ? pending > 0 && <Review count={pending} /> : end}
        </header>
        {children}
      </div>
    </div>
  );
}
