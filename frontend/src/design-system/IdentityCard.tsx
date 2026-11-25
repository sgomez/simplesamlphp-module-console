import { LogoutIcon } from './icons';

interface IdentityCardProps {
  identity: string;
  logoutUrl: string;
}

export function IdentityCard({ identity, logoutUrl }: IdentityCardProps) {
  return (
    <div className="card identity-card">
      <div className="identity">
        <span className="identity-name">{identity}</span>
      </div>
      <a className="logout" href={logoutUrl} aria-label="Log out" title="Log out">
        <LogoutIcon />
      </a>
    </div>
  );
}
