import { Fragment, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import type { SessionLinks } from '../domain/database';
import { Shell as Layout } from '../design-system/Shell';
import { ReviewChanges } from './ReviewChanges';
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

function Crumbs({ crumbs }: { crumbs: readonly Crumb[] }) {
  return (
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
            <span aria-current="page" className="crumb-current wrap-any">
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
  );
}

export function Shell({ session, pending, crumbs, end, children }: ShellProps) {
  const { key } = useLocation();
  const head = (
    <>
      <Crumbs crumbs={crumbs} />
      {end === undefined ? pending > 0 && <ReviewChanges count={pending} variant="global" /> : end}
    </>
  );

  return (
    <Layout side={<Sidebar session={session} pending={pending} />} head={head} navKey={key}>
      {children}
    </Layout>
  );
}
