import type { FormSchema } from '../../documents';
import type { Doc } from './document';
import { requiredIn, rootOption } from './presence';

export interface Found {
  name: string;
  title: string;
  group: string;
  set: boolean;
  // Why an option that does not apply cannot be added.
  reason: string | null;
}

const shown = (value: unknown) => (typeof value === 'string' ? value : JSON.stringify(value));

function reasonOf(when: Record<string, unknown[]>): string {
  const parts = Object.entries(when).map(([name, values]) => `${name} is ${values.map(shown).join(' or ')}`);

  return `Applies only when ${parts.join(' and ')}.`;
}

// Every root option but `extra`, set or not, by name or title.
export function findOptions(schema: FormSchema, doc: Doc, query: string): Found[] {
  const words = query.trim().toLowerCase();
  if (words === '') {
    return [];
  }
  const required = requiredIn(schema, doc);

  return schema.groups.flatMap(({ title: group, properties }) =>
    properties
      .filter((name) => name !== 'extra')
      .map((name) => rootOption(schema, doc, name, required))
      .filter(({ name, node }) => name.toLowerCase().includes(words) || (node.title ?? '').toLowerCase().includes(words))
      .map(({ name, node, set, applies }) => ({
        name,
        title: node.title ?? name,
        group,
        set,
        reason: applies ? null : reasonOf(node.when ?? {}),
      })),
  );
}
