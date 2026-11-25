import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Chip } from './Chip';

const meta = {
  title: 'Design system/Chip',
  component: Chip,
  parameters: { layout: 'padded' },
  args: { children: 'Override' },
} satisfies Meta<typeof Chip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Facts: Story = {
  render: () => (
    <div className="toolbar">
      <Chip>Override</Chip>
      <Chip>Secret reference</Chip>
      <Chip>Read-only</Chip>
      <Chip>File authsource</Chip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const chips = [...canvasElement.querySelectorAll('.chip')];

    await expect(chips.map((chip) => chip.textContent)).toEqual(['Override', 'Secret reference', 'Read-only', 'File authsource']);
  },
};

export const WithTitle: Story = {
  args: { title: 'Replaces the entity with the same ID from the federation feed' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Override')).toHaveAttribute('title', 'Replaces the entity with the same ID from the federation feed');
  },
};
