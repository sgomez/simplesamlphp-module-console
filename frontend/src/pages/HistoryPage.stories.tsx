import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { StoryScreens } from '../app/test/StoryScreens';

const meta = {
  title: 'Pages/History',
  component: StoryScreens,
  parameters: { route: '/history' },
} satisfies Meta<typeof StoryScreens>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Board: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await expect(await page.findByText('Autumn onboarding: travel and library')).toBeVisible();

    await expect(page.getByRole('link', { name: 'Snapshots' })).toHaveAttribute('aria-current', 'page');
    await expect(page.getAllByRole('link', { name: 'Roll back to this' })).toHaveLength(4);
    await expect(page.getByText('Live')).toBeVisible();
    await expect(page.getByText('5 of 10 kept')).toBeVisible();
  },
};

export const NothingPublished: Story = {
  name: 'Draft: Nothing published',
  args: { history: { list: { snapshots: [], current: null, retention: 10 } }, pending: 3 },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole('heading', { name: 'Nothing published yet' })).toBeVisible();
  },
};
