import { LogoutIcon } from './icons';

interface IdentityCardProps {
  identity: string;
  adminUrl: string;
  logoutUrl: string;
}

export function IdentityCard({ identity, adminUrl, logoutUrl }: IdentityCardProps) {
  return (
    <div className="card identity-card">
      <div className="identity">
        <span className="identity-name">{identity}</span>
        <a className="identity-link" href={adminUrl}>
          Administration
        </a>
      </div>
      <a className="logout" href={logoutUrl} aria-label="Log out" title="Log out">
        <LogoutIcon />
      </a>
    </div>
  );
}
