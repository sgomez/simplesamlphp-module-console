import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { attention, boardOverview, firstRun } from '../app/adapters/memory/overview';
import { StoryScreens } from '../app/test/StoryScreens';

const meta = {
  title: 'Pages/Overview',
  component: StoryScreens,
  parameters: { route: '/' },
} satisfies Meta<typeof StoryScreens>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FirstRun: Story = {
  name: 'First run',
  args: { overview: { overview: firstRun }, pending: 0, counts: {} },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByRole('heading', { name: 'Nothing is managed yet' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Add a service provider' })).toHaveAttribute('href', '/entities/saml20-sp-remote/new');
    await expect(page.getByRole('link', { name: 'Import existing entities' })).toHaveAttribute('href', '/external');
  },
};

export const Clear: Story = {
  args: { pending: 0 },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByText('Nothing')).toBeVisible();
    await expect(page.getByText('Snapshot #42')).toBeVisible();
    await expect(page.getByText(/^Published 24 Nov 2026, 09:12 by/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'History and rollback' })).toHaveAttribute('href', '/history');
    await expect(page.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
  },
};

export const NeedsAttention: Story = {
  name: 'Draft: Needs attention',
  args: { overview: { overview: { ...boardOverview, attention, current: { number: 42, createdAt: '2026-11-24T09:12:00', createdBy: 'admin', comment: 'Autumn onboarding: travel and library' } } } },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByRole('link', { name: '7 changes to publish' })).toHaveAttribute('href', '/publish');
    await expect(page.getByRole('link', { name: 'idp-2 is 2 Snapshots behind' })).toHaveAttribute('href', '/nodes');
    await expect(page.getByRole('link', { name: 'Library catalogue: external source changed' })).toBeVisible();
    await expect(page.getByText('Autumn onboarding: travel and library')).toBeVisible();
  },
};

export const NothingPublished: Story = {
  name: 'Draft: Nothing published',
  args: { overview: { overview: { ...boardOverview, attention: [{ kind: 'pending', count: 3 }], current: null } }, pending: 3 },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText('Nothing published yet')).toBeVisible();
  },
};
