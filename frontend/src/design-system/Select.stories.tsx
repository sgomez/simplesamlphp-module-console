import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Select } from './Select';

const meta = {
  title: 'Design system/Select',
  component: Select,
  parameters: { layout: 'padded' },
  args: { label: 'Format', value: 'persistent', options: ['persistent', 'transient'], onChange: fn() },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const select = within(canvasElement).getByRole('combobox', { name: 'Format' });

    await expect(select.tagName).toBe('SELECT');
    await expect(select).toHaveClass('input');
    await expect(select).toHaveValue('persistent');
    await userEvent.tab();
    await expect(select).toHaveFocus();
    await userEvent.selectOptions(select, 'transient');
    await expect(args.onChange).toHaveBeenCalledWith('transient');
  },
};
