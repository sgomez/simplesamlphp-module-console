import { plural } from '../../../lib/plural';
import type { PastedFormat } from '../port';

const PHP = 'PHP array';

function xmlLabel(text: string): string {
  const entities = text.match(/<(?:[\w-]+:)?EntityDescriptor\b/g)?.length ?? 0;

  return entities === 0 ? 'SAML metadata' : `SAML metadata · ${plural(entities, 'entity', 'entities')}`;
}

export function detectFormat(text: string): PastedFormat {
  return text.trimStart().startsWith('<') ? 'xml' : 'php';
}

// The choices of the Detected select, the XML one with the entities it describes.
export function formatChoices(text: string): Record<PastedFormat, string> {
  return { xml: xmlLabel(text), php: PHP };
}
