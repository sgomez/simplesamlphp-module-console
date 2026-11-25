import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { FileButton } from './FileButton';

const read = fn();

const meta = {
  title: 'Design system/File button',
  component: FileButton,
  parameters: { layout: 'padded' },
  args: { label: 'Choose file', onText: read },
  beforeEach: () => {
    read.mockClear();
  },
} satisfies Meta<typeof FileButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Choose: Story = {
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Choose file' });
    const input = canvasElement.querySelector('input[type=file]') as HTMLInputElement;

    await expect(button).toHaveClass('btn btn-secondary', { exact: true });
    await expect(input).not.toBeVisible();
    await userEvent.upload(input, new File(["<?php\n$config = [];"], 'authsources.php', { type: 'text/plain' }));
    await waitFor(() => expect(read).toHaveBeenCalledWith("<?php\n$config = [];"));
  },
};

export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    await expect(within(canvasElement).getByRole('button', { name: 'Choose file' })).toHaveFocus();
  },
};
