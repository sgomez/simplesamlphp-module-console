import { Link } from 'react-router';
import type { SessionLinks } from '../domain/database';
import { navigation, useSessionPort, type Counts, type NavEntry } from '../domain/session';
import { IdentityCard } from '../design-system/IdentityCard';
import { NavItem } from '../design-system/NavItem';
import { plural } from '../lib/plural';
import { SCREENS } from './paths';

function Entry({ entry }: { entry: NavEntry }) {
  if ('href' in entry) {
    return <NavItem href={entry.href} label={entry.label} />;
  }
  const { screen, label, count, badge } = entry;

  return (
    <NavItem
      to={SCREENS[screen]}
      end={screen === 'overview'}
      label={label}
      count={count}
      badge={badge === null ? null : { count: badge, label: `${plural(badge, 'change', 'changes')} to publish` }}
    />
  );
}

interface SidebarProps {
  session: SessionLinks | null;
  pending: number;
  counts: Counts;
}

export function Sidebar({ session, pending, counts }: SidebarProps) {
  const { screens } = useSessionPort();

  return (
    <nav className="side-nav" aria-label="Main">
      <div className="side-body">
        <Link className="brand" to="/">
          <span className="brand-name">SimpleSAMLphp</span>
          <span className="brand-host">{window.location.hostname}</span>
        </Link>
        {navigation(screens, counts, pending, session?.core ?? null).map(({ head, entries }) => (
          <div className="nav-group" key={head ?? ''}>
            {head !== null && <h2 className="nav-head">{head}</h2>}
            {entries.map((entry) => (
              <Entry key={entry.label} entry={entry} />
            ))}
          </div>
        ))}
      </div>
      {session && (
        <div className="side-foot">
          <IdentityCard identity={session.identity} logoutUrl={session.logoutUrl} />
        </div>
      )}
    </nav>
  );
}
