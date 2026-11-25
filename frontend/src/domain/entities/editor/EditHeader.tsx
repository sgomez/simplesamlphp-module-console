import { Button } from '../../../design-system/Button';
import { MenuButton, type MenuEntry } from '../../../design-system/Menu';
import { Switch } from '../../../design-system/Switch';

export interface Enabled {
  on: boolean;
  onChange: (on: boolean) => void;
}

interface EditHeaderProps {
  title: string;
  // A new object has no entity ID until it is saved, and no secondary actions.
  entityId: string | null;
  enabled?: Enabled | null;
  actions?: readonly MenuEntry[];
}

export function EditHeader({ title, entityId, enabled, actions }: EditHeaderProps) {
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
            <Button variant="quiet" small onPress={() => void navigator.clipboard.writeText(entityId)}>
              Copy
            </Button>
          </div>
        )}
      </div>
      {enabled && <Switch label="Enabled" labelled checked={enabled.on} onChange={enabled.onChange} />}
      {actions && actions.length > 0 && <MenuButton label="More actions" entries={actions} />}
    </div>
  );
}
