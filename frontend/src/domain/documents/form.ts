// What the form engine reads of a schema, with every `$ref` resolved by `npm run generate`.

export type FormType = 'string' | 'boolean' | 'integer' | 'number' | 'object' | 'array' | 'any';

export type FormWidget = 'radio' | 'textarea' | 'suggest' | 'certificate' | 'key-slot' | 'certificates';

// A branch that makes options required: an `if` on a sibling's value, or a `dependentRequired` key.
export type FormRule =
  | { if: { name: string; value: unknown }; then: string[]; else: string[] }
  | { present: string; then: string[] };

export interface FormNode {
  type: FormType;
  title?: string;
  description?: string;
  default?: unknown;
  examples?: unknown[];
  enum?: unknown[];
  const?: unknown;
  widget?: FormWidget;
  when?: Record<string, unknown[]>;
  sensitive?: true;
  literal?: true;
  authsource?: true;
  properties?: Record<string, FormNode>;
  required?: string[];
  rules?: FormRule[];
  items?: FormNode;
  // A map, such as a language map: the schema of each value.
  values?: FormNode;
}

export interface FormGroup {
  title: string;
  properties: string[];
}

export interface FormSchema extends FormNode {
  groups: FormGroup[];
  properties: Record<string, FormNode>;
}
