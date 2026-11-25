import type { FormNode } from '../../documents';

export type ControlKind =
  | 'text'
  | 'textarea'
  | 'suggest'
  | 'select'
  | 'radio'
  | 'switch'
  | 'number'
  | 'fields'
  | 'certificate'
  | 'rows'
  | 'certificates'
  | 'map'
  | 'json'
  | 'authsource'
  | 'secret';

// SPEC 10.10, Controls: the type decides, unless `x-widget` says otherwise. `key-slot` renders its fields.
export function controlOf(node: FormNode): ControlKind {
  const { type, widget } = node;
  if (widget === 'certificate' || widget === 'certificates') {
    return widget;
  }
  if (widget === 'textarea' && type !== 'string') {
    return 'json';
  }
  if (node.sensitive) {
    return 'secret';
  }
  if (node.authsource) {
    return 'authsource';
  }
  switch (type) {
    case 'string':
      if (node.enum !== undefined) {
        return widget === 'radio' ? 'radio' : 'select';
      }

      return widget === 'textarea' || widget === 'suggest' ? widget : 'text';
    case 'boolean':
      return 'switch';
    case 'integer':
    case 'number':
      return 'number';
    case 'object':
      return node.values === undefined ? 'fields' : 'map';
    case 'array':
      return 'rows';
    default:
      return 'json';
  }
}

// A row whose fields are all single-line controls sits on one line.
export function isInline(item: FormNode): boolean {
  return Object.values(item.properties ?? {}).every((field) => {
    const kind = controlOf(field);

    return ['text', 'suggest', 'select', 'number', 'authsource', 'switch'].includes(kind);
  });
}

// "Add endpoint", "Add source": the title of a row, else "value".
export function rowName(item: FormNode): string {
  return item.title ?? 'value';
}
