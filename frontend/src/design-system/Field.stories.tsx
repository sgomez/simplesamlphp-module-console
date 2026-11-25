import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Field } from './Field';
import { Input } from './Input';
import { TextArea } from './TextArea';

const meta = {
  title: 'Design system/Field',
  component: Field,
  parameters: { layout: 'padded' },
  args: { label: 'Location', value: 'https://sp.example.edu/acs', onChange: fn(), children: <Input mono type="url" /> },
} satisfies Meta<typeof Field>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const page = within(canvasElement);
    const input = page.getByRole('textbox', { name: 'Location' });

    await expect(canvasElement.querySelector('.field')).toContainElement(input);
    await expect(page.getByText('Location')).toHaveClass('label');
    await expect(input).toHaveClass('input mono');
    await expect(canvasElement.querySelector('.help, .msg-error')).toBeNull();
    await userEvent.click(page.getByText('Location'));
    await expect(input).toHaveFocus();
    await userEvent.keyboard('{End}x');
    await expect(args.onChange).toHaveBeenCalledWith('https://sp.example.edu/acsx');
  },
};

export const Help: Story = {
  args: { help: 'Where responses go.' },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    const help = page.getByText('Where responses go.');

    await expect(help).toHaveClass('help');
    await expect(page.getByRole('textbox', { name: 'Location' })).toHaveAccessibleDescription('Where responses go.');
  },
};

export const Invalid: Story = {
  args: { value: 'disco.example.edu/ds', error: 'Enter the full URL, starting with https://.' },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    const input = page.getByRole('textbox', { name: 'Location' });

    await expect(page.getByRole('alert').closest('.msg-error')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveTextContent('Enter the full URL, starting with https://.');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAttribute('data-invalid', 'true');
    await expect(input).toHaveAccessibleDescription('Enter the full URL, starting with https://.');
  },
};

export const Optional: Story = {
  args: { label: 'Comment', optional: true, value: '', children: <TextArea rows={3} /> },
  play: async ({ canvasElement, args }) => {
    const page = within(canvasElement);
    const area = page.getByRole('textbox', { name: 'Comment (optional)' });

    await expect(area.tagName).toBe('TEXTAREA');
    await expect(area).toHaveAttribute('rows', '3');
    await expect(page.getByText('(optional)')).toHaveClass('faint label-optional');
    await userEvent.tab();
    await expect(area).toHaveFocus();
    await userEvent.keyboard('a');
    await expect(args.onChange).toHaveBeenCalledWith('a');
  },
};
