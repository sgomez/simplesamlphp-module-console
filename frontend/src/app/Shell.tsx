import { Fragment, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import type { SessionLinks } from '../domain/database';
import { Shell as Layout } from '../design-system/Shell';
import { ReviewChanges } from '../domain/publication';
import type { Counts } from '../domain/session';
import { Sidebar } from './Sidebar';

export interface Crumb {
  label: string;
  to?: string;
}

interface ShellProps {
  session: SessionLinks | null;
  pending: number;
  counts?: Counts;
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

export function Shell({ session, pending, counts = {}, crumbs, end, children }: ShellProps) {
  const { key } = useLocation();
  const head = (
    <>
      <Crumbs crumbs={crumbs} />
      {end === undefined ? pending > 0 && <ReviewChanges count={pending} variant="global" /> : end}
    </>
  );

  return (
    <Layout side={<Sidebar session={session} pending={pending} counts={counts} />} head={head} navKey={key}>
      {children}
    </Layout>
  );
}
