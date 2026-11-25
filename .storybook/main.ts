import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['./Foundations.mdx', '../frontend/src/**/*.stories.tsx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: { name: '@storybook/react-vite', options: {} },
  core: { disableTelemetry: true },
  async viteFinal(viteConfig) {
    // vendor/simplesamlphp/simplesamlphp/modules/console links back to the repository root.
    const watch = { ignored: ['**/vendor/**'], followSymlinks: false };
    return { ...viteConfig, server: { ...viteConfig.server, proxy: {}, watch } };
  },
};

export default config;
