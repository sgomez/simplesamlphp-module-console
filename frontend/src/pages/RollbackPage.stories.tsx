import type { Meta, StoryObj } from '@storybook/react-vite';
import { destroyAnnouncer } from 'react-aria/private/live-announcer/LiveAnnouncer';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { StoryScreens } from '../app/test/StoryScreens';

const meta = {
  title: 'Pages/Rollback',
  component: StoryScreens,
  parameters: { route: '/history/40/rollback' },
} satisfies Meta<typeof StoryScreens>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Board: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByRole('heading', { name: 'Roll back to Snapshot #40' })).toBeVisible();
    await expect(page.getByText('Saved changes are not touched')).toBeVisible();
    await expect(page.getByText('5 more objects change')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', '/history');
    await expect(page.getByRole('button', { name: 'Roll back to #40' })).toBeEnabled();
  },
};

export const LostRace: Story = {
  name: 'Draft: Lost race',
  args: { history: { rollback: 'moved' } },
  parameters: { screenshot: 'after-play' },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await userEvent.click(await page.findByRole('button', { name: 'Roll back to #40' }));

    await expect(await page.findByText('The live Snapshot changed while this page was open')).toBeVisible();
    await expect(page.getByText('Snapshot #42 is live now. This is the current difference.')).toBeVisible();
  },
};

export const Damaged: Story = {
  name: 'Draft: Damaged Snapshot',
  args: { history: { plan: { broken: 'checksum' } } },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByText('Snapshot #40 cannot be rolled back to')).toBeVisible();
    await expect(page.queryByRole('button', { name: 'Roll back to #40' })).toBeNull();
    await expect(page.queryByText('What changes on the nodes')).toBeNull();
  },
};

export const ModulesMissing: Story = {
  name: 'Draft: Module missing on this node',
  args: { history: { plan: { missingModules: ['ldap'] } } },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByText('A module is missing on this node')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Roll back to #40' })).toBeEnabled();
  },
};

export const RolledBack: Story = {
  name: 'Draft: Rolled back',
  parameters: { screenshot: 'after-play' },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await userEvent.click(await page.findByRole('button', { name: 'Roll back to #40' }));

    await expect(await page.findByText('web-03')).toBeVisible();
    await expect(page.getByText('Snapshot #40 is live again.')).toBeVisible();
    // The pending button announced itself and is gone with its page; axe rejects the announcement left behind.
    await waitFor(() => expect(document.querySelector('[data-live-announcer] [role="img"]')).not.toBeNull());
    destroyAnnouncer();
  },
};
