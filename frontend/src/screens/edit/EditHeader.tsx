import { Button } from '../../components/ui/Button';
import { MenuButton } from '../../components/ui/Menu';

// A new object has no entity ID until it is saved, and nothing to delete.
export function EditHeader({ title, entityId, onDelete }: { title: string; entityId: string | null; onDelete?: () => void }) {
  return (
    <div className="page-head">
      <div className="title-block">
        <div className="title">
          <h1 className="h1 wrap-any">{title}</h1>
          <span className="small muted">Service provider</span>
          <span className="mono faint">saml20-sp-remote</span>
        </div>
        {entityId !== null && (
          <div className="obj-id">
            <span className="mono muted wrap-any">{entityId}</span>
            <Button variant="quiet" small onClick={() => void navigator.clipboard.writeText(entityId)}>
              Copy
            </Button>
          </div>
        )}
      </div>
      {onDelete && (
        <MenuButton label="More actions" entries={[{ label: 'Delete…', onSelect: onDelete, danger: true }]} />
      )}
    </div>
  );
}
