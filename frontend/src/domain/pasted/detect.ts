import { plural } from '../../lib/plural';
import type { PastedFormat } from './types';

export const MAX_BYTES = 1024 * 1024;

export function detectFormat(text: string): PastedFormat {
  return text.trimStart().startsWith('<') ? 'xml' : 'php';
}

function count(text: string, format: PastedFormat): number {
  const found = format === 'xml' ? text.match(/<(?:[\w-]+:)?EntityDescriptor\b/g) : text.match(/\$metadata\s*\[/g);

  return found?.length ?? 0;
}

// SPEC 10.12: "SAML metadata · 1 entity", "PHP array"; a PHP array is counted only when it holds several, as the boards do.
export function formatLabels(text: string): Record<PastedFormat, string> {
  const detected = detectFormat(text);
  const label = (format: PastedFormat, name: string) => {
    const n = count(text, format);

    return format === detected && n > (format === 'php' ? 1 : 0) ? `${name} · ${plural(n, 'entity', 'entities')}` : name;
  };

  return { xml: label('xml', 'SAML metadata'), php: label('php', 'PHP array') };
}

export function tooLarge(text: string): boolean {
  return new TextEncoder().encode(text).length > MAX_BYTES;
}
