import type { FormNode, FormSchema } from '../../documents';
import { isObject, isSet, omit, type Doc } from './document';

// A newly added root option: a boolean starts opposite its default, anything else empty. The default is never written.
export function initialValue(node: FormNode): unknown {
  switch (node.type) {
    case 'boolean':
      return node.default !== true;
    case 'string':
      return '';
    case 'array':
      return [];
    case 'object':
      return {};
    default:
      return null;
  }
}

// A new list row: one empty control, or an object with its required text fields empty.
export function rowValue(item: FormNode): unknown {
  if (item.type !== 'object') {
    return item.type === 'string' ? '' : initialValue(item);
  }
  const fields = (item.required ?? []).flatMap((name) => {
    const field = item.properties?.[name];

    return field?.type === 'string' ? [[name, '']] : [];
  });

  return Object.fromEntries(fields);
}

export function addOption(schema: FormSchema, doc: Doc, name: string): Doc {
  if (isSet(doc, name)) {
    return doc;
  }

  return { ...doc, [name]: initialValue(schema.properties[name] as FormNode) };
}

export function unsetOption(doc: Doc, name: string): Doc {
  return omit(doc, name);
}

export function setOption(doc: Doc, name: string, value: unknown): Doc {
  return { ...doc, [name]: value };
}

export function addRow(list: readonly unknown[], item: FormNode): unknown[] {
  return [...list, rowValue(item)];
}

export function removeRow(list: readonly unknown[], index: number): unknown[] {
  return list.filter((_, at) => at !== index);
}

export function setRow(list: readonly unknown[], index: number, value: unknown): unknown[] {
  return list.map((item, at) => (at === index ? value : item));
}

export function moveRow(list: readonly unknown[], index: number, by: number): unknown[] {
  const to = index + by;
  if (to < 0 || to >= list.length) {
    return [...list];
  }
  const out = [...list];
  const [moved] = out.splice(index, 1);
  out.splice(to, 0, moved);

  return out;
}

export function entriesOf(value: unknown): [string, unknown][] {
  return isObject(value) ? Object.entries(value) : [];
}

// Map rows keep their order when a key is renamed.
export function renameKey(map: Doc, from: string, to: string): Doc {
  if (from === to || isSet(map, to)) {
    return map;
  }

  return Object.fromEntries(Object.entries(map).map(([key, value]) => [key === from ? to : key, value]));
}

export function addMapRow(map: Doc, item: FormNode): Doc {
  return isSet(map, '') ? map : { ...map, '': rowValue(item) };
}
