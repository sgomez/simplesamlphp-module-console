import { NavLink } from 'react-router';
import type { LinkTarget } from './Button';

type NavItemProps = LinkTarget & {
  label: string;
  count?: number | null;
  badge?: { count: number; label: string } | null;
  // Active on its own path only, not below it.
  end?: boolean;
};

const number = new Intl.NumberFormat('en');
const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'nav-item active' : 'nav-item');

export function NavItem(props: NavItemProps) {
  const { label, count, badge } = props;
  const content = (
    <>
      <span>{label}</span>
      {count != null && <span className="nav-count">{number.format(count)}</span>}
      {badge && (
        <span className="nav-badge" aria-label={badge.label}>
          {badge.count}
        </span>
      )}
    </>
  );

  return props.to !== undefined ? (
    <NavLink className={navClass} to={props.to} end={props.end ?? false}>
      {content}
    </NavLink>
  ) : (
    <a className="nav-item" href={props.href}>
      {content}
    </a>
  );
}
