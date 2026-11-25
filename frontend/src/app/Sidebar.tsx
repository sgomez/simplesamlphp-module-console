import { Link, NavLink } from 'react-router';
import type { SessionLinks } from '../api/types';
import { IdentityCard } from '../components/ui/IdentityCard';
import { plural } from './counts';
import { PUBLISH, SP_LIST } from './paths';

const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'nav-item active' : 'nav-item');

function SideFoot({ session }: { session: SessionLinks }) {
  return (
    <div className="side-foot">
      <IdentityCard identity={session.identity} adminUrl={session.adminUrl} logoutUrl={session.logoutUrl} />
    </div>
  );
}

export function Sidebar({ session, pending }: { session: SessionLinks | null; pending: number }) {
  return (
    <nav className="side-nav" aria-label="Main">
      <div className="side-body">
        <Link className="brand" to="/">
          <span className="brand-name">SimpleSAMLphp</span>
          <span className="brand-host">{window.location.hostname}</span>
        </Link>
        <div className="nav-group">
          <h2 className="nav-head">Entities</h2>
          <NavLink className={navClass} to={SP_LIST}>
            <span>Service providers</span>
          </NavLink>
        </div>
        <div className="nav-group">
          <h2 className="nav-head">Changes</h2>
          <NavLink className={navClass} to={PUBLISH}>
            <span>Publish</span>
            {pending > 0 && (
              <span className="nav-badge" aria-label={`${plural(pending, 'change', 'changes')} to publish`}>
                {pending}
              </span>
            )}
          </NavLink>
        </div>
      </div>
      {session && <SideFoot session={session} />}
    </nav>
  );
}
