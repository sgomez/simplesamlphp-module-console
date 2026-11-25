import { composeStories, setProjectAnnotations } from '@storybook/react-vite';
import { render } from '@testing-library/react';
import type { ComponentType } from 'react';
import { describe, expect, test } from 'vitest';
import { commands, page } from 'vitest/browser';
import preview from '../../../.storybook/preview';

declare module 'vitest/browser' {
  interface BrowserCommands {
    emulate: (scheme: 'light' | 'dark') => Promise<void>;
  }
}

setProjectAnnotations(preview);

const modules = import.meta.glob<Parameters<typeof composeStories>[0]>('./*.stories.tsx', { eager: true });
const SCHEMES = ['light', 'dark'] as const;
const WIDTHS = [1440, 400] as const;
const HEIGHT = 900;

function kebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

// The frame grows to the page's height, so the screenshot holds the whole page and nothing scrolls.
async function settle(width: number): Promise<void> {
  await document.fonts.ready;
  await new Promise((resolve) => setTimeout(resolve, 50));
  await page.viewport(width, Math.max(HEIGHT, document.documentElement.scrollHeight));
  await new Promise((resolve) => requestAnimationFrame(resolve));
}

for (const [file, module] of Object.entries(modules)) {
  const prefix = kebab(file.replace(/^\.\/(.+)\.stories\.tsx$/, '$1'));

  describe(prefix, () => {
    for (const [key, Story] of Object.entries(composeStories(module)) as [string, ComponentType][]) {
      for (const scheme of SCHEMES) {
        for (const width of WIDTHS) {
          test(`${key} ${scheme} ${width}`, async () => {
            await commands.emulate(scheme);
            await page.viewport(width, HEIGHT);
            render(<Story />);
            await settle(width);

            await expect(page.elementLocator(document.body)).toMatchScreenshot(`${prefix}-${kebab(key)}-${scheme}-${width}`, {
              screenshotOptions: { animations: 'disabled', caret: 'hide' },
            });
          });
        }
      }
    }
  });
}
