import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { flatGroups } from '../app/adapters/memory/changes';
import { boardReview } from '../app/adapters/memory/publication';
import { PublishFrame } from '../app/test/PublishFrame';

const meta = {
  title: 'Pages/Publish states',
  component: PublishFrame,
  parameters: { route: '/publish' },
} satisfies Meta<typeof PublishFrame>;

export default meta;

type Story = StoryObj<typeof meta>;

const served = { ...boardReview, groups: flatGroups.map(({ state, changes }) => ({ state, changes: changes.map(({ entityId, name, loadError, opens }) => ({ entityId, name, loadError, opens })) })) };
const withdrawn = served.groups.filter(({ state }) => state !== 'To be withdrawn');

export const Served: Story = {
  name: 'Draft: Ready, as the API serves it',
  args: { publication: { review: { ...served, groups: withdrawn }, full: false }, pending: 6 },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    const panel = await page.findByRole('complementary', { name: 'This Publication' });

    await expect(panel).not.toHaveTextContent('Nodes');
    await expect(page.queryByRole('button', { name: /Discard/ })).toBeNull();
    await expect(page.getByRole('link', { name: /Library catalogue/ })).toBeVisible();
  },
};

export const FirstPublication: Story = {
  name: 'Draft: Before the first Publication',
  args: { publication: { review: { ...served, groups: withdrawn.slice(1, 2), warnings: [], current: null, nextNumber: 1 }, full: false }, live: null, pending: 2 },
};

export const NeverPublished: Story = {
  name: 'Draft: Nothing to publish, never published',
  args: { publication: { review: { ...boardReview, groups: [], warnings: [], current: null, nextNumber: 1 } }, live: null },
};

export const Unreadable: Story = {
  name: 'Draft: Unreadable and unnamed rows',
  args: {
    publication: {
      review: {
        ...boardReview,
        warnings: [],
        groups: [
          { state: 'Unreadable', changes: [{ entityId: 'https://bad.example.org/sp', name: null, loadError: 'The stored document is not valid JSON.', opens: false }] },
          { state: 'Unpublished', changes: [{ entityId: 'https://unnamed.example.edu/shibboleth', name: null, loadError: null, opens: true }] },
          ...boardReview.groups.slice(3),
        ],
        problems: [{ entityId: 'https://bad.example.org/sp', name: null, message: 'It cannot be read.' }],
        canPublish: false,
      },
      full: false,
    },
    pending: 4,
  },
};

export const Problems: Story = {
  name: 'Draft: Several problems',
  args: {
    publication: {
      review: {
        ...served,
        canPublish: false,
        problems: [
          { entityId: 'default-sp', name: 'default-sp', message: 'privatekey file default-sp-2027.pem was not found on this node.' },
          { entityId: null, name: null, message: 'The Snapshot is larger than the database allows.' },
        ],
      },
      full: false,
    },
    pending: 7,
  },
};

export const Loading: Story = {
  name: 'Draft: Loading',
  args: { publication: { pending: true }, pending: 7 },
};
