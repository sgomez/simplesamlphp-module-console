import type Ajv from 'ajv/dist/2020';

// Annotations only: none of them validates, and the form engine reads `x-when`.
const ANNOTATIONS = {
  $error: 'object',
  'x-when': 'object',
  'x-groups': 'array',
  'x-widget': 'string',
  'x-sensitive': 'boolean',
  'x-literal': 'boolean',
  'x-authsource-reference': 'boolean',
} as const;

export function declareKeywords(ajv: Ajv): Ajv {
  for (const [keyword, schemaType] of Object.entries(ANNOTATIONS)) {
    ajv.addKeyword({ keyword, schemaType });
  }

  return ajv;
}
