import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentProps } from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';

function Opened(props: ComponentProps<typeof ConfirmDialog>) {
  const [open, setOpen] = useState(props.open);
  const close = (then: () => void) => () => {
    then();
    setOpen(false);
  };

  return (
    <>
      <Button onPress={() => setOpen(true)}>Discard all…</Button>
      <ConfirmDialog {...props} open={open} onCancel={close(props.onCancel)} onConfirm={close(props.onConfirm)} />
    </>
  );
}

const meta = {
  title: 'Design system/ConfirmDialog',
  component: ConfirmDialog,
  parameters: { layout: 'padded' },
  args: {
    open: false,
    title: 'Discard all 7 changes?',
    text: 'Every saved change since Snapshot #41 is removed: 3 modified, 2 new, 1 withdrawn and 1 deleted object go back to what is live. This cannot be undone.',
    cancel: 'Keep changes',
    confirm: 'Discard 7 changes',
    onCancel: fn(),
    onConfirm: fn(),
  },
  render: (args) => <Opened {...args} />,
} satisfies Meta<typeof ConfirmDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

const opener = (canvasElement: HTMLElement) => within(canvasElement).getByRole('button', { name: 'Discard all…' });

async function openWithKeyboard(canvasElement: HTMLElement) {
  await expect(screen.queryByRole('alertdialog')).toBeNull();
  await userEvent.tab();
  await expect(opener(canvasElement)).toHaveFocus();
  await userEvent.keyboard('{Enter}');

  return screen.findByRole('alertdialog', { name: 'Discard all 7 changes?' });
}

export const Open: Story = {
  args: { open: true },
  play: async () => {
    const dialog = await screen.findByRole('alertdialog', { name: 'Discard all 7 changes?' });
    const modal = dialog.closest('dialog');

    await expect(modal).toHaveClass('card dialog');
    await expect(modal?.matches(':modal')).toBe(true);
    await expect(dialog).toHaveAccessibleDescription(/This cannot be undone\.$/);
    await expect(within(dialog).getByRole('heading', { level: 3 })).toHaveClass('h2 wrap-any');
    await expect(within(dialog).getByText(/^Every saved change/)).toHaveClass('small muted dialog-text wrap-any');
    await expect(within(dialog).getByRole('button', { name: 'Discard 7 changes' })).toHaveClass('btn btn-danger-solid');
    await expect(within(dialog).getByRole('button', { name: 'Keep changes' })).toHaveFocus();
  },
};

export const Delete: Story = {
  args: {
    open: true,
    title: 'Delete https://a.example.org?',
    text: 'https://a.example.org is removed from the Console.',
    cancel: 'Cancel',
    confirm: 'Delete',
  },
  play: async () => {
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete https://a.example.org?' });

    await expect(within(dialog).getAllByRole('button').map((b) => b.textContent)).toEqual(['Cancel', 'Delete']);
  },
};

export const Busy: Story = {
  args: { open: true, busy: true },
  play: async ({ args }) => {
    const dialog = await screen.findByRole('alertdialog');
    const confirm = within(dialog).getByRole('button', { name: 'Discard 7 changes' });

    await expect(confirm).toHaveAttribute('data-pending', 'true');
    await expect(within(dialog).getByRole('button', { name: 'Keep changes' })).toBeDisabled();
    await userEvent.click(confirm);
    await userEvent.keyboard('{Escape}');
    await expect(args.onConfirm).not.toHaveBeenCalled();
    await expect(args.onCancel).not.toHaveBeenCalled();
    await expect(dialog.closest('dialog')?.open).toBe(true);
  },
};

export const EscapeCancels: Story = {
  name: 'Escape cancels and hands the focus back',
  play: async ({ canvasElement, args }) => {
    await openWithKeyboard(canvasElement);
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    await expect(args.onCancel).toHaveBeenCalledOnce();
    await expect(opener(canvasElement)).toHaveFocus();
  },
};

export const KeyboardConfirms: Story = {
  name: 'The keyboard confirms',
  play: async ({ canvasElement, args }) => {
    const dialog = await openWithKeyboard(canvasElement);
    await userEvent.tab();
    await expect(within(dialog).getByRole('button', { name: 'Discard 7 changes' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    await expect(args.onConfirm).toHaveBeenCalledOnce();
    await expect(opener(canvasElement)).toHaveFocus();
  },
};

export const CancelButton: Story = {
  name: 'Cancel closes it',
  play: async ({ canvasElement, args }) => {
    await userEvent.click(opener(canvasElement));
    await userEvent.click(await screen.findByRole('button', { name: 'Keep changes' }));

    await waitFor(() => expect(args.onCancel).toHaveBeenCalledOnce());
  },
};
