import type { ReactNode } from 'react';
import { Button } from '../../../design-system/Button';
import { GripIcon, RemoveIcon } from '../../../design-system/icons';
import { MenuButton, type MenuEntry } from '../../../design-system/Menu';
import type { FormNode } from '../../documents';
import { controlOf, isInline, rowName } from '../engine/controls';
import { pointerOf } from '../engine/document';
import { addRow, moveRow, removeRow, setRow } from '../engine/values';
import { Control } from './Control';
import { FieldsControl } from './Fields';
import { InlineFields } from './InlineFields';
import type { ControlProps } from './props';

function moves(index: number, count: number, move: (by: number) => void): MenuEntry[] {
  return [
    ...(index > 0 ? [{ label: 'Move up', onSelect: () => move(-1) }] : []),
    ...(index < count - 1 ? [{ label: 'Move down', onSelect: () => move(1) }] : []),
  ];
}

function rowControl(item: FormNode, props: ControlProps, certificates: boolean): ReactNode {
  if (item.type === 'object' && !certificates && isInline(item)) {
    return <InlineFields {...props} node={item} />;
  }
  if (item.type === 'object') {
    return (
      <div className="form-row-fields">
        <FieldsControl {...props} node={item} certificate={certificates} named />
      </div>
    );
  }

  return <Control {...props} node={item} />;
}

// SPEC 10.10: rows that can be added, removed and moved; each holds one control, or all the fields of an object.
export function RowsControl({ node, value, pointer, label, onChange }: ControlProps) {
  const item = node.items ?? { type: 'any' };
  const list = Array.isArray(value) ? value : [];
  const name = rowName(item);
  const stacked = item.type === 'object' && (controlOf(node) === 'certificates' || !isInline(item));

  return (
    <div className="form-rows">
      {list.map((row, index) => {
        const at = `${label}, ${name} ${index + 1}`;

        return (
          <div key={index} className={stacked ? 'form-row form-row-top' : 'form-row'}>
            {list.length > 1 && (
              <MenuButton label={`Move ${at}`} icon={<GripIcon />} entries={moves(index, list.length, (by) => onChange(moveRow(list, index, by)))} />
            )}
            {rowControl(
              item,
              { node: item, value: row, pointer: pointerOf(pointer, index), label: at, onChange: (next) => onChange(setRow(list, index, next)) },
              controlOf(node) === 'certificates',
            )}
            <Button variant="quiet" iconOnly label={`Remove ${at}`} onPress={() => onChange(removeRow(list, index))}>
              <RemoveIcon />
            </Button>
          </div>
        );
      })}
      <span className={list.length > 1 ? 'form-row-add' : undefined}>
        <Button small label={`Add ${name} to ${label}`} onPress={() => onChange(addRow(list, item))}>
          {`Add ${name}`}
        </Button>
      </span>
    </div>
  );
}
