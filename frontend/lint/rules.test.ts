// @vitest-environment node
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

async function messages(file: string) {
  const eslint = new ESLint({ ignore: false });
  const [result] = await eslint.lintFiles([`frontend/lint/fixtures/${file}`]);

  return (result?.messages ?? []).map(({ ruleId, line }) => `${ruleId}@${line}`);
}

describe('the lint rules of the front end', () => {
  it('reject a raw button outside components/ui', async () => {
    expect(await messages('RawButton.tsx')).toEqual(['no-restricted-syntax@2']);
  });

  it('reject a raw link, facts list or disclosure outside components/ui', async () => {
    expect(await messages('RawMarkup.tsx')).toEqual([
      'no-restricted-syntax@1',
      'no-restricted-syntax@2',
      'no-restricted-syntax@3',
      'no-restricted-syntax@3',
    ]);
  });

  it('reject a stylesheet import, a style prop, raw HTML and a raw dialog', async () => {
    expect(await messages('Violations.tsx')).toEqual([
      'no-restricted-imports@1',
      'react/forbid-dom-props@6',
      'react/no-danger@7',
      'no-restricted-syntax@8',
    ]);
  });

  it('reject imports from the PHP side and of the schemas', async () => {
    expect(await messages('ServerImports.tsx')).toEqual([
      'no-restricted-imports@1',
      'no-restricted-imports@2',
      'no-restricted-imports@3',
    ]);
  });

  it('reject creating a native form or dialog element by name', async () => {
    expect(await messages('CreateElement.tsx')).toEqual([
      'no-restricted-syntax@4',
      'no-restricted-syntax@4',
      'no-restricted-syntax@4',
    ]);
  });
});
