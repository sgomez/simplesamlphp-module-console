import css from '../frontend/src/console.css?raw';

export interface Token {
  name: string;
  light: string;
  dark: string | undefined;
}

function properties(block: string): Map<string, string> {
  return new Map([...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [name as string, (value as string).trim()]));
}

const light = properties(/:root\{([^}]*)\}/.exec(css)?.[1] ?? '');
const dark = properties(/@media \(prefers-color-scheme:dark\)\{:root\{([^}]*)\}/.exec(css)?.[1] ?? '');

export const tokens: Token[] = [...light].map(([name, value]) => ({ name, light: value, dark: dark.get(name) }));

export const colours = tokens.filter((token) => token.light.startsWith('#'));
export const shadows = tokens.filter((token) => token.name.startsWith('--shadow'));
export const radii = tokens.filter((token) => token.name.startsWith('--r-'));
export const fonts = tokens.filter((token) => token.name === '--sans' || token.name === '--mono');

export interface TypeStyle {
  className: string;
  rule: string;
}

// The type classes of the stylesheet: every class rule that sets a font size.
export const typeScale: TypeStyle[] = [...css.matchAll(/(?:^|[\s}])\.([\w-]+)\{([^}]*font-size:[^}]*)\}/g)]
  .map(([, className, rule]) => ({ className: className as string, rule: (rule as string).trim() }))
  .filter(({ className }) => ['h1', 'h2', 'h3', 'small', 'xs', 'mono'].includes(className));
