import { Button } from '../../design-system/Button';
import { ErrorIcon, RemoveIcon, WarningIcon } from '../../design-system/icons';
import { useForm } from './context';
import { Control } from './controls/Control';
import { Hint } from './controls/Hint';
import { pointerOf } from './engine/document';
import { within } from './engine/issues';
import type { RootOption } from './engine/presence';

interface OptionRowProps {
  option: RootOption;
  value: unknown;
  // Differs from the saved document.
  edited: boolean;
  onChange: (value: unknown) => void;
  onUnset: () => void;
}

export const optionId = (name: string) => `o-${name}`;

// SPEC 10.10, each option: title, name, control, its messages, description and hint, and Unset.
export function OptionRow({ option, value, edited, onChange, onUnset }: OptionRowProps) {
  const { name, node, required } = option;
  const pointer = pointerOf('', name);
  const issues = within(useForm().issues, pointer);
  const title = node.title ?? name;

  return (
    <div id={optionId(name)} className="opt">
      <div className="opt-head">
        <span className="label">{title}</span>
        <span className="mono faint wrap-any">{name}</span>
        {required && <span className="xs faint">Required</span>}
        {edited && <span className="xs opt-edited">Edited</span>}
      </div>
      <div className="opt-body">
        <Control node={node} value={value} pointer={pointer} label={title} onChange={onChange} />
        {issues.map(({ message, kind }, index) => (
          <div key={index} className={kind === 'error' ? 'msg-error' : 'msg-warning'}>
            {kind === 'error' ? <ErrorIcon /> : <WarningIcon />}
            <span>{message}</span>
          </div>
        ))}
        <Hint node={node} />
      </div>
      {required ? (
        <span aria-hidden="true" className="opt-spacer" />
      ) : (
        <span className="opt-unset">
          <Button variant="quiet" iconOnly label={`Unset ${name}`} onPress={onUnset}>
            <RemoveIcon />
          </Button>
        </span>
      )}
    </div>
  );
}
