import { Button } from '../../components/ui/Button';

export function EditHeader({ title, entityId }: { title: string; entityId: string }) {
  return (
    <div className="page-head">
      <div className="title-block">
        <div className="title">
          <h1 className="h1">{title}</h1>
          <span className="small muted">Service provider</span>
          <span className="mono faint">saml20-sp-remote</span>
        </div>
        <div className="obj-id">
          <span className="mono muted wrap-any">{entityId}</span>
          <Button variant="quiet" small onClick={() => void navigator.clipboard.writeText(entityId)}>
            Copy
          </Button>
        </div>
      </div>
    </div>
  );
}
