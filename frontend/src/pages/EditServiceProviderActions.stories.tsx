import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, userEvent, within } from 'storybook/test';
import { edited } from '../app/adapters/memory/edited';
import { EDIT_ROUTE, EditFrame } from '../app/test/EditFrame';

const meta = {
  title: 'Pages/Edit service provider, actions',
  component: EditFrame,
  parameters: { route: EDIT_ROUTE },
} satisfies Meta<typeof EditFrame>;

export default meta;

type Story = StoryObj<typeof meta>;

async function openMenu(canvasElement: HTMLElement): Promise<HTMLElement> {
  await userEvent.click(await within(canvasElement).findByRole('button', { name: 'More actions' }));

  return within(document.body).findByRole('menu');
}

async function choose(canvasElement: HTMLElement, entry: string): Promise<HTMLElement> {
  await userEvent.click(within(await openMenu(canvasElement)).getByRole('menuitem', { name: entry }));

  return within(document.body).findByRole('dialog');
}

export const MoreActions: Story = {
  name: 'Draft: More actions',
  args: { entities: { entities: [edited()] }, pending: 7 },
  play: async ({ canvasElement }) => {
    const items = within(await openMenu(canvasElement)).getAllByRole('menuitem');

    await expect(items.map((item) => item.textContent)).toEqual(['Replace from…', 'Download', 'Discard changes…', 'Delete…']);
  },
};

export const MoreActionsServed: Story = {
  name: 'Draft: More actions, as the API serves today',
  args: { entities: { entities: [edited()], served: true }, pending: 7 },
  play: async ({ canvasElement }) => {
    const items = within(await openMenu(canvasElement)).getAllByRole('menuitem');

    await expect(items.map((item) => item.textContent)).toEqual(['Download', 'Delete…']);
    await expect(within(canvasElement).queryByRole('switch')).toBeNull();
  },
};

export const Discard: Story = {
  name: 'Draft: Discard changes',
  args: { entities: { entities: [edited()] }, pending: 7 },
  play: async ({ canvasElement }) => {
    const dialog = await choose(canvasElement, 'Discard changes…');

    await expect(within(dialog).getByText('Moodle returns to its published version.')).toBeVisible();
    await expect(within(dialog).getByRole('button', { name: 'Keep changes' })).toHaveFocus();
  },
};

export const Discarded: Story = {
  name: 'Draft: Changes discarded',
  args: { entities: { entities: [edited()] }, pending: 7 },
  play: async ({ canvasElement }) => {
    const dialog = await choose(canvasElement, 'Discard changes…');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Discard changes' }));

    await expect(await within(canvasElement).findByText('Published')).toBeVisible();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const Promote: Story = {
  name: 'Draft: Promote, for a set with a next key',
  args: { entities: { entities: [edited({ nextKey: true })] }, pending: 7 },
  play: async ({ canvasElement }) => {
    const dialog = await choose(canvasElement, 'Promote…');

    await expect(within(dialog).getByRole('heading', { name: 'Promote the next key of Moodle?' })).toBeVisible();
  },
};

export const Delete: Story = {
  name: 'Draft: Delete',
  args: { entities: { entities: [edited()] }, pending: 7 },
  play: async ({ canvasElement }) => {
    const dialog = await choose(canvasElement, 'Delete…');

    await expect(within(dialog).getByText('Moodle is removed from the Console. Nodes keep serving it until the next Publication, which withdraws it.')).toBeVisible();
    await expect(within(dialog).getByRole('button', { name: 'Delete Moodle' })).toBeVisible();
  },
};
