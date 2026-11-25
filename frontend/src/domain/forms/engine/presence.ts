import type { FormNode, FormSchema } from '../../documents';
import { isSet, same, type Doc } from './document';

// `x-when`: the property applies while each sibling it names holds one of the values.
export function applies(node: FormNode, siblings: Doc): boolean {
  return Object.entries(node.when ?? {}).every(([name, values]) => values.some((value) => same(siblings[name], value)));
}

// The required list, with what the `if` branches and `dependentRequired` add for these values.
export function requiredIn(node: FormNode, value: Doc): Set<string> {
  const out = new Set(node.required ?? []);
  for (const rule of node.rules ?? []) {
    if ('present' in rule) {
      if (isSet(value, rule.present)) {
        rule.then.forEach((name) => out.add(name));
      }
      continue;
    }
    const holds = isSet(value, rule.if.name) && same(value[rule.if.name], rule.if.value);
    (holds ? rule.then : rule.else).forEach((name) => out.add(name));
  }

  return out;
}

export interface RootOption {
  name: string;
  node: FormNode;
  set: boolean;
  required: boolean;
  applies: boolean;
}

export function rootOption(schema: FormSchema, doc: Doc, name: string, required = requiredIn(schema, doc)): RootOption {
  const node = schema.properties[name] as FormNode;
  const applying = applies(node, doc);

  return { name, node, set: isSet(doc, name), required: applying && required.has(name), applies: applying };
}

// Rendered: set or required, and applying. A set option that stopped applying is hidden; the server drops it.
export function isRendered(option: RootOption): boolean {
  return option.applies && (option.set || option.required);
}

export function isAddable(option: RootOption): boolean {
  return option.applies && !option.set && !option.required;
}

export interface GroupView {
  title: string;
  options: RootOption[];
  addable: RootOption[];
  // N of M: set options that apply, of the options that apply.
  set: number;
  total: number;
}

export function groupsOf(schema: FormSchema, doc: Doc): GroupView[] {
  const required = requiredIn(schema, doc);

  return schema.groups.map(({ title, properties }) => {
    const all = properties.map((name) => rootOption(schema, doc, name, required));
    const applying = all.filter((option) => option.applies);

    return {
      title,
      options: all.filter(isRendered),
      addable: all.filter(isAddable),
      set: applying.filter((option) => option.set).length,
      total: applying.length,
    };
  });
}
