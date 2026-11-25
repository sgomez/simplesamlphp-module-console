import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { flatGroups } from '../app/adapters/memory/changes';
import { pressPublish as publish, PublishFrame, silence } from '../app/test/PublishFrame';
import { boardReview } from '../app/adapters/memory/publication';

const meta = {
  title: 'Pages/Publish outcomes',
  component: PublishFrame,
  parameters: { route: '/publish' },
} satisfies Meta<typeof PublishFrame>;

export default meta;

type Story = StoryObj<typeof meta>;

const served = {
  ...boardReview,
  groups: flatGroups.slice(0, 2).map(({ state, changes }) => ({ state, changes: changes.map(({ entityId, name, loadError, opens }) => ({ entityId, name, loadError, opens })) })),
};

export const MovedServed: Story = {
  name: 'Draft: Moved, as the API serves it',
  args: { publication: { review: served, answer: { kind: 'moved', moved: { review: served } }, full: false }, pending: 7 },
  play: async ({ canvasElement }) => {
    await publish(canvasElement);

    await expect(await within(canvasElement).findByText('This is the current list.')).toBeVisible();
  },
};

export const Publishing: Story = {
  name: 'Draft: Publishing',
  args: { publication: {}, pending: 7, more: { publish: () => new Promise(() => undefined) } },
  play: async ({ canvasElement }) => {
    await publish(canvasElement);

    await expect(within(canvasElement).getByRole('button', { name: 'Publishing' })).toHaveAttribute('data-pending', 'true');
  },
};

export const NotPublished: Story = {
  name: 'Draft: Not published',
  args: { publication: { answer: { kind: 'failed', failed: { status: 500, body: null } } }, pending: 7 },
  play: async ({ canvasElement }) => {
    await publish(canvasElement);

    await expect(await within(canvasElement).findByRole('alert')).toHaveTextContent('Not published: the server answered 500.');
  },
};

export const BuildFailed: Story = {
  name: 'Draft: Published, this node could not build it',
  args: { publication: { answer: { kind: 'published', published: { number: 42, build: 'This node could not build Snapshot #42: disk full.' } } }, live: 42 },
  play: async ({ canvasElement }) => {
    await publish(canvasElement);

    await expect(await within(canvasElement).findByText(/disk full/)).toBeVisible();
    silence();
  },
};

export const DiscardAll: Story = {
  name: 'Draft: Discard all',
  args: { publication: {}, pending: 7 },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await userEvent.click(await page.findByRole('button', { name: 'Discard all 7 changes…' }));

    const dialog = await page.findByRole('alertdialog', { name: 'Discard all 7 changes?' });
    await expect(dialog).toHaveTextContent(
      'Every saved change since Snapshot #41 is removed: 3 modified, 2 new, 1 withdrawn and 1 deleted object go back to what is live. This cannot be undone.',
    );
    await expect(within(dialog).getByRole('button', { name: 'Keep changes' })).toHaveFocus();
  },
};
