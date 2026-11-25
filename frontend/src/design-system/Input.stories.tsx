import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Input } from './Input';

const meta = {
  title: 'Design system/Input',
  component: Input,
  parameters: { layout: 'padded' },
  args: { label: 'Text input', onChange: fn() },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { defaultValue: 'Text' },
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByRole('textbox', { name: 'Text input' });

    await expect(input).toHaveClass('input');
    await expect(input).toHaveAttribute('type', 'text');
    await expect(input).not.toHaveAttribute('aria-invalid');
    await userEvent.tab();
    await expect(input).toHaveFocus();
    await expect(input).toHaveAttribute('data-focus-visible', 'true');
    await userEvent.keyboard('{End}s');
    await expect(args.onChange).toHaveBeenLastCalledWith('Texts');
  },
};

export const Hover: Story = {
  args: { defaultValue: 'Text' },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox', { name: 'Text input' });

    // The real pointer's first move into the frame ends a synthetic hover, so hover until it holds.
    await waitFor(async () => {
      await userEvent.unhover(input);
      await userEvent.hover(input);
      await expect(input).toHaveAttribute('data-hovered', 'true');
    });
    await userEvent.unhover(input);
    await waitFor(() => expect(input).not.toHaveAttribute('data-hovered'));
  },
};

export const Monospace: Story = {
  args: { label: 'Monospace input', type: 'url', mono: true, defaultValue: 'https://example.edu/sp' },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox', { name: 'Monospace input' });

    await expect(input).toHaveClass('input mono');
    await expect(input).toHaveAttribute('type', 'url');
  },
};

export const Search: Story = {
  args: { label: 'Search', type: 'search', name: 'q', placeholder: 'Search by name or entity ID' },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('searchbox', { name: 'Search' });

    await expect(input).toHaveAttribute('name', 'q');
    await expect(input).toHaveAttribute('placeholder', 'Search by name or entity ID');
  },
};

export const Invalid: Story = {
  args: { label: 'Input with error', invalid: true, defaultValue: 'disco.example.edu/ds' },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox', { name: 'Input with error' });

    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAttribute('data-invalid', 'true');
    await expect(getComputedStyle(input).boxShadow).not.toBe('none');
  },
};

export const Disabled: Story = {
  args: { label: 'Disabled input', disabled: true, defaultValue: 'Disabled' },
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByRole('textbox', { name: 'Disabled input' });

    await expect(input).toBeDisabled();
    await expect(input).toHaveAttribute('data-disabled', 'true');
    await userEvent.tab();
    await expect(input).not.toHaveFocus();
    await userEvent.type(input, 'x');
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

export const Suggestions: Story = {
  args: { suggestions: ['%secret(sp-key)%'] },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('combobox', { name: 'Text input' });
    const list = canvasElement.querySelector(`#${input.getAttribute('list') ?? ''}`);

    await expect(list?.tagName).toBe('DATALIST');
    await expect(list?.querySelector('option')).toHaveValue('%secret(sp-key)%');
  },
};

export const Number: Story = {
  args: { type: 'number', value: '3' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('spinbutton', { name: 'Text input' })).toHaveValue(3);
  },
};
