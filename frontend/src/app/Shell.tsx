import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { consoleUrl } from '../api/client';
import type { Session } from '../api/types';
import { Button, LinkButton } from '../components/ui/Button';
import { MenuIcon } from '../components/ui/icons';
import { Sidebar } from './Sidebar';

interface ShellProps {
  session: Session | null;
  crumb: string | undefined;
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

export function Shell({ session, crumb, children }: ShellProps) {
  const { key } = useLocation();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === key;
  const pending = session?.pendingCount ?? 0;

  return (
    <div className="shell">
      <div id="nav" className={open ? 'shell-side is-open' : 'shell-side'}>
        <Sidebar session={session} />
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
        <main className="page">{children}</main>
      </div>
    </div>
  );
}
