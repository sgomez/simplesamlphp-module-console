import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { TextArea } from './TextArea';

const meta = {
  title: 'Design system/TextArea',
  component: TextArea,
  parameters: { layout: 'padded' },
  args: { label: 'Certificate PEM', value: '', onChange: fn() },
} satisfies Meta<typeof TextArea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const area = within(canvasElement).getByRole('textbox', { name: 'Certificate PEM' });

    await expect(area.tagName).toBe('TEXTAREA');
    await expect(area).toHaveClass('input');
    await expect(area).toHaveAttribute('rows', '2');
    await userEvent.tab();
    await expect(area).toHaveFocus();
    await userEvent.keyboard('a');
    await expect(args.onChange).toHaveBeenCalledWith('a');
  },
};

export const Monospace: Story = {
  args: { mono: true, rows: 3, placeholder: 'Paste the PEM certificate, with or without the BEGIN and END lines' },
  play: async ({ canvasElement }) => {
    const area = within(canvasElement).getByRole('textbox', { name: 'Certificate PEM' });

    await expect(area).toHaveClass('input mono');
    await expect(area).toHaveAttribute('rows', '3');
  },
};

export const Invalid: Story = {
  args: { mono: true, invalid: true, value: 'not a certificate' },
  play: async ({ canvasElement }) => {
    const area = within(canvasElement).getByRole('textbox', { name: 'Certificate PEM' });

    await expect(area).toHaveAttribute('aria-invalid', 'true');
    await expect(area).toHaveAttribute('data-invalid', 'true');
  },
};
