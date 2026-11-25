import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['./Foundations.mdx', '../frontend/src/**/*.stories.tsx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: { name: '@storybook/react-vite', options: {} },
  core: { disableTelemetry: true },
  async viteFinal(viteConfig) {
    return { ...viteConfig, server: { ...viteConfig.server, proxy: {} } };
  },
};

export default config;
