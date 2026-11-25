import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import { visual } from './frontend/visual/config.ts';

// The dev node's baseurlpath is /simplesaml/; the shell points at these paths when dev_server is set.
const DEV_BASE = '/simplesaml/module.php/console/assets/app/';

export default defineConfig(({ command }) => ({
  root: 'frontend',
  base: command === 'serve' ? DEV_BASE : './',
  plugins: [react()],
  build: {
    outDir: '../public/assets/app',
    emptyOutDir: true,
    manifest: true,
    rolldownOptions: {
      input: ['src/main.tsx', 'src/console.css'].map((path) => `${import.meta.dirname}/frontend/${path}`),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: process.env.CONSOLE_DEV_HOSTS?.split(',').filter(Boolean) ?? [],
    hmr: { overlay: false },
    proxy: {
      [`^/simplesaml/(?!module\\.php/console/assets/app/)`]: {
        target: process.env.CONSOLE_DEV_UPSTREAM ?? 'http://localhost:8080',
        changeOrigin: false,
      },
    },
  },
  test: {
    root: '.',
    coverage: {
      provider: 'v8',
      include: ['frontend/src/**/*.{ts,tsx}'],
      exclude: [
        'frontend/src/**/*.{test,stories}.{ts,tsx}',
        'frontend/src/app/test/**',
        'frontend/src/app/adapters/memory/**',
        'frontend/src/domain/documents/generated/**',
      ],
      thresholds: { lines: 90 },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['frontend/src/**/*.test.{ts,tsx}', 'frontend/lint/**/*.test.ts', 'frontend/build/**/*.test.ts'],
          restoreMocks: true,
          unstubGlobals: true,
          setupFiles: ['frontend/src/app/test/setup.ts'],
        },
      },
      {
        extends: true,
        plugins: [storybookTest({ configDir: `${import.meta.dirname}/.storybook` })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      visual,
    ],
  },
}));
