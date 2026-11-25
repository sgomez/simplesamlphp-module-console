import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Diff } from './Diff';

const meta = {
  title: 'Design system/Diff',
  component: Diff,
  parameters: { layout: 'padded' },
  args: {
    lines: [
      { kind: 'same', text: "'NameIDFormat' => 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent'," },
      { kind: 'del', text: "'validate.authnrequest' => false," },
      { kind: 'add', text: "'validate.authnrequest' => true," },
      { kind: 'sec', text: "'privatekey_pass'  secret changed, value not shown" },
    ],
  },
} satisfies Meta<typeof Diff>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Lines: Story = {
  play: async ({ canvasElement }) => {
    const lines = [...canvasElement.querySelectorAll('.dl')];
    const signs = lines.map((line) => line.querySelector('.ds') as HTMLElement);

    await expect(lines.map((line) => line.className)).toEqual(['dl', 'dl dl-del', 'dl dl-add', 'dl dl-sec']);
    await expect(signs.map((sign) => sign.textContent)).toEqual(['', '-', '+', '~']);
    await expect(signs.map((sign) => getComputedStyle(sign).userSelect)).toEqual(['none', 'none', 'none', 'none']);
  },
};
