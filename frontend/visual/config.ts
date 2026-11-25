import { join } from 'node:path';
import { playwright } from '@vitest/browser-playwright';
import type { BrowserCommand } from 'vitest/node';
import type { TestProjectInlineConfiguration } from 'vitest/config';

export const VISUAL_PORT = 3765;

type Scheme = 'light' | 'dark';

const emulate: BrowserCommand<[Scheme]> = async (context, colorScheme) => {
  if (context.provider.name !== 'playwright') {
    throw new Error('The visual tests run on Playwright.');
  }
  await (context as unknown as { page: { emulateMedia: (media: object) => Promise<void> } }).page.emulateMedia({
    colorScheme,
    reducedMotion: 'reduce',
  });
};

// Only the browser runs in the Playwright image; Vitest runs on the host and reaches it over the socket.
export const visual: TestProjectInlineConfiguration = {
  extends: true,
  test: {
    name: 'visual',
    include: ['frontend/src/pages/**/*.visual.tsx'],
    css: { include: [/.+/] },
    setupFiles: ['frontend/src/app/test/setup.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({
        connectOptions: {
          wsEndpoint: process.env['CONSOLE_VISUAL_WS'] ?? `ws://127.0.0.1:${VISUAL_PORT}/`,
          exposeNetwork: '<loopback>',
        },
      }),
      instances: [{ browser: 'chromium' }],
      viewport: { width: 1440, height: 900 },
      commands: { emulate },
      expect: {
        toMatchScreenshot: {
          // vitest#12018: the default name carries the host's platform although the browser is always Linux.
          resolveScreenshotPath: ({ arg, ext, root, testFileDirectory, screenshotDirectory, testFileName }) =>
            join(root, testFileDirectory, screenshotDirectory, testFileName, `${arg}${ext}`),
          comparatorName: 'pixelmatch',
          comparatorOptions: { threshold: 0.1, allowedMismatchedPixels: 0 },
        },
      },
    },
  },
};
