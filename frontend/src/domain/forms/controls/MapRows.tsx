import { Button } from '../../../design-system/Button';
import { RemoveIcon } from '../../../design-system/icons';
import { Input } from '../../../design-system/Input';
import { isObject, omit, pointerOf, type Doc } from '../engine/document';
import { addMapRow, renameKey } from '../engine/values';
import { useInvalid } from '../context';
import { Control } from './Control';
import type { ControlProps } from './props';

function KeyField({ value, pointer, label, onChange }: { value: string; pointer: string; label: string; onChange: (key: string) => void }) {
  const invalid = useInvalid(pointer);

  return (
    <span className="row-key">
      <Input label={label} mono value={value} placeholder="en" invalid={invalid} onChange={onChange} />
    </span>
  );
}

// A language map: rows of language code and text.
export function MapRowsControl({ node, value, pointer, label, onChange }: ControlProps) {
  const map: Doc = isObject(value) ? value : {};
  const item = node.values ?? { type: 'string' };
  const entries = Object.entries(map);

  return (
    <div className="form-rows">
      {entries.map(([key, text], index) => (
        <div key={index} className="form-row">
          <KeyField value={key} pointer={pointerOf(pointer, key)} label={`${label}, language ${index + 1}`} onChange={(to) => onChange(renameKey(map, key, to))} />
          <Control
            node={item}
            value={text}
            pointer={pointerOf(pointer, key)}
            label={`${label}, text ${index + 1}`}
            onChange={(next) => onChange({ ...map, [key]: next })}
          />
          <Button variant="quiet" iconOnly label={`Remove ${label}, language ${index + 1}`} onPress={() => onChange(omit(map, key))}>
            <RemoveIcon />
          </Button>
        </div>
      ))}
      <span>
        <Button small label={`Add language to ${label}`} disabled={Object.hasOwn(map, '')} onPress={() => onChange(addMapRow(map, item))}>
          Add language
        </Button>
      </span>
    </div>
  );
}
