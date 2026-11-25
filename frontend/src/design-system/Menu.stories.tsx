import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { GripIcon } from './icons';
import { MenuButton } from './Menu';

const meta = {
  title: 'Design system/Menu',
  component: MenuButton,
  parameters: { layout: 'padded' },
  args: {
    label: 'More actions',
    entries: [
      { label: 'Download', onSelect: fn() },
      { label: 'Delete…', onSelect: fn(), danger: true, separated: true },
    ],
  },
} satisfies Meta<typeof MenuButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'More actions' });

    await expect(button).toHaveAttribute('aria-haspopup', 'true');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(screen.queryByRole('menu')).toBeNull();
  },
};

export const Open: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'More actions' }));
    const menu = await screen.findByRole('menu');

    await expect(menu).toHaveClass('card menu');
    await expect(within(menu).getAllByRole('menuitem').map((item) => item.className)).toEqual(['nav-item', 'nav-item is-danger']);
    await expect(within(menu).getByRole('separator')).toBeVisible();
  },
};

export const Keyboard: Story = {
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'More actions' });
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    const items = await screen.findAllByRole('menuitem');

    await waitFor(() => expect(items[0]).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}');
    await expect(items[1]).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(button).toHaveFocus());
    await expect(screen.queryByRole('menu')).toBeNull();

    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(screen.getAllByRole('menuitem')[0]).toHaveFocus());
    await userEvent.keyboard('{ArrowUp}{Enter}');

    await waitFor(() => expect(args.entries[1]?.onSelect).toHaveBeenCalledOnce());
    await expect(args.entries[0]?.onSelect).not.toHaveBeenCalled();
    await waitFor(() => expect(button).toHaveFocus());
    await expect(screen.queryByRole('menu')).toBeNull();
  },
};

export const ChoiceHandsFocusBack: Story = {
  name: 'A choice hands the focus back first',
  args: {
    entries: [
      {
        label: 'Delete…',
        danger: true,
        onSelect: fn(() => {
          document.body.dataset['focused'] = document.activeElement?.textContent ?? '';
        }),
      },
    ],
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'More actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete…' }));

    await waitFor(() => expect(document.body.dataset['focused']).toBe('More actions'));
  },
};

export const OutsidePress: Story = {
  name: 'A press outside closes it',
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'More actions' }));
    await screen.findByRole('menu');
    await userEvent.click(document.body);

    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  },
};

export const Icon: Story = {
  name: 'An icon button',
  args: { label: 'Move row 1', icon: <GripIcon />, entries: [{ label: 'Move down', onSelect: fn() }] },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Move row 1' });

    await expect(button).toHaveClass('btn-quiet', 'btn-icon');
    await userEvent.click(button);
    await expect(await screen.findByRole('menuitem', { name: 'Move down' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
  },
};
