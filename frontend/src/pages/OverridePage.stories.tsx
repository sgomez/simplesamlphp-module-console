import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { boardComparison } from '../app/adapters/memory/overrides';
import { StoryScreens } from '../app/test/StoryScreens';

const meta = {
  title: 'Pages/Compare',
  component: StoryScreens,
  parameters: { route: `/entities/saml20-sp-remote/override?entityid=${encodeURIComponent(boardComparison.entityId)}` },
} satisfies Meta<typeof StoryScreens>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Board: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByRole('heading', { name: 'Library catalogue' })).toBeVisible();
    await expect(page.getByText('The source changed on 21 Nov 2026')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mark as reviewed' })).toBeEnabled();
    await expect(page.getByText('Differs · new in source')).toBeVisible();
    await expect(page.getAllByText('Same')).toHaveLength(3);
  },
};

export const NotReviewed: Story = {
  name: 'Draft: Never reviewed',
  args: { overrides: { comparison: { ...boardComparison, changedOn: null } } },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText('The source has not been reviewed')).toBeVisible();
  },
};
