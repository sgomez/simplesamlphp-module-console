import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { consoleUrl } from '../api/client';
import type { SessionLinks } from '../api/types';
import { Button, LinkButton } from '../components/ui/Button';
import { MenuIcon } from '../components/ui/icons';
import { Sidebar } from './Sidebar';

interface ShellProps {
  session: SessionLinks | null;
  pending: number;
  crumb: string | undefined;
  parent?: { label: string; to: string } | undefined;
  // The width of a state or failure page.
  narrow?: boolean;
  children: ReactNode;
}

function Review({ count }: { count: number }) {
  return (
    <LinkButton variant="global" small href={consoleUrl('/publish')}>
      <span className="dot dot-half" aria-hidden="true" />
      {`Review ${count} ${count === 1 ? 'change' : 'changes'}`}
    </LinkButton>
  );
}

export function Shell({ session, pending, crumb, parent, narrow, children }: ShellProps) {
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
            {parent && (
              <>
                <span aria-hidden="true" className="faint">
                  /
                </span>
                <Link className="crumb" to={parent.to}>
                  {parent.label}
                </Link>
              </>
            )}
            {crumb && (
              <>
                <span aria-hidden="true" className="faint">
                  /
                </span>
                <span aria-current="page" className="crumb-current">
                  {crumb}
                </span>
              </>
            )}
          </nav>
          {pending > 0 && <Review count={pending} />}
        </header>
        <main className={narrow ? 'page page-narrow' : 'page'}>{children}</main>
      </div>
    </div>
  );
}
