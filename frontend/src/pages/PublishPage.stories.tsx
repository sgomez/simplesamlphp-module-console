import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { flatGroups } from '../app/adapters/memory/changes';
import { boardReview } from '../app/adapters/memory/publication';
import { pressPublish as publish, PublishFrame, silence } from '../app/test/PublishFrame';

const meta = {
  title: 'Pages/Publish',
  component: PublishFrame,
  parameters: { route: '/publish' },
} satisfies Meta<typeof PublishFrame>;

export default meta;

type Story = StoryObj<typeof meta>;

const blocked = {
  ...boardReview,
  groups: flatGroups,
  warnings: [],
  canPublish: false,
  problems: [{ entityId: 'default-sp', name: 'default-sp', message: 'privatekey file default-sp-2027.pem was not found on this node.' }],
};

export const Ready: Story = {
  args: { publication: {}, pending: 7 },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await userEvent.click(await page.findByRole('button', { name: /Library catalogue/ }));
    await userEvent.click(page.getByRole('button', { name: /default-sp/ }));

    await expect(page.getByRole('complementary', { name: 'This Publication' })).toHaveTextContent('Nodes3');
    await expect(page.getAllByRole('link', { name: 'Open' })).toHaveLength(2);
    await expect(page.getByRole('button', { name: 'Discard all 7 changes…' })).toBeVisible();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const Blocked: Story = {
  args: { publication: { review: blocked }, pending: 7 },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByText('1 problem blocks publishing')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Publish 7 changes' })).toBeDisabled();
  },
};

export const Moved: Story = {
  args: {
    publication: {
      review: { ...boardReview, groups: flatGroups, warnings: [] },
      answer: {
        kind: 'moved',
        moved: { review: { ...boardReview, groups: flatGroups, warnings: [], hash: 'moved' }, last: { name: 'Moodle', when: '1 minute ago' } },
      },
    },
    pending: 7,
  },
  play: async ({ canvasElement }) => {
    await publish(canvasElement);

    await expect(await within(canvasElement).findByText('Moodle was saved again 1 minute ago. This is the current list.')).toBeVisible();
  },
};

export const Empty: Story = {
  args: { publication: { review: { ...boardReview, groups: [], warnings: [], current: { number: 42, createdAt: null } } }, live: 42 },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement.querySelector('main') as HTMLElement).findByRole('link', { name: 'History' })).toBeVisible();
  },
};

export const Done: Story = {
  args: { publication: {}, live: 42 },
  play: async ({ canvasElement }) => {
    await publish(canvasElement);
    const page = within(canvasElement);

    await expect(await page.findByText('Snapshot #42 is published')).toBeVisible();
    await expect(await page.findByText('Still on #41')).toBeVisible();
    silence();
  },
};
