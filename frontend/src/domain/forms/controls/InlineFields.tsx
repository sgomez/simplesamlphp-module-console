import { isObject, pointerOf, withField, type Doc } from '../engine/document';
import { applies, requiredIn } from '../engine/presence';
import { Control } from './Control';
import type { ControlProps } from './props';

// The fields of a row on one line, each named by the row and its title.
export function InlineFields({ node, value, pointer, label, onChange }: ControlProps) {
  const object: Doc = isObject(value) ? value : {};
  const required = requiredIn(node, object);

  return (
    <>
      {Object.entries(node.properties ?? {})
        .filter(([, field]) => applies(field, object))
        .map(([name, field]) => (
          <Control
            key={name}
            node={field}
            value={object[name]}
            pointer={pointerOf(pointer, name)}
            label={`${label}, ${field.title ?? name}`}
            placeholder={field.title ?? name}
            onChange={(next) => onChange(withField(object, name, next, required.has(name)))}
          />
        ))}
    </>
  );
}
