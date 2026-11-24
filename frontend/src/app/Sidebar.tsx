import { Link, NavLink } from 'react-router';
import { consoleUrl } from '../api/client';
import type { Session } from '../api/types';
import { LogoutIcon } from '../components/ui/icons';

function SideFoot({ session }: { session: Session }) {
  return (
    <div className="side-foot">
      <div className="card identity-card">
        <div className="identity">
          <span className="identity-name">{session.identity}</span>
          <a className="identity-link" href={session.adminUrl}>
            Administration
          </a>
        </div>
        <a className="logout" href={session.logoutUrl} aria-label="Log out" title="Log out">
          <LogoutIcon />
        </a>
      </div>
    </div>
  );
}

export function Sidebar({ session }: { session: Session | null }) {
  const pending = session?.pendingCount ?? 0;

  return (
    <nav className="side-nav" aria-label="Main">
      <div className="side-body">
        <Link className="brand" to="/">
          <span className="brand-name">SimpleSAMLphp</span>
          <span className="brand-host">{window.location.hostname}</span>
        </Link>
        <div className="nav-group">
          <h2 className="nav-head">Entities</h2>
          <NavLink className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} to="/entities/saml20-sp-remote">
            <span>Service providers</span>
          </NavLink>
        </div>
        <div className="nav-group">
          <h2 className="nav-head">Changes</h2>
          <a className="nav-item" href={consoleUrl('/publish')}>
            <span>Publish</span>
            {pending > 0 && (
              <span className="nav-badge" aria-label={`${pending} changes to publish`}>
                {pending}
              </span>
            )}
          </a>
        </div>
      </div>
      {session && <SideFoot session={session} />}
    </nav>
  );
}
