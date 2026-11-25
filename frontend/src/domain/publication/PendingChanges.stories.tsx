import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { LiveSnapshot } from './LiveSnapshot';
import { ReviewChanges } from './ReviewChanges';

interface Indicator {
  count: number;
  variant: 'global' | 'secondary' | 'live';
}

function PendingChanges({ count, variant }: Indicator) {
  return variant === 'live' ? <LiveSnapshot current={{ number: count, createdAt: '2026-11-20 10:15:00' }} /> : <ReviewChanges count={count} variant={variant} />;
}

const meta = {
  title: 'Domain/Publication/Pending changes',
  component: PendingChanges,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PendingChanges>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Header: Story = {
  args: { count: 7, variant: 'global' },
  play: async ({ canvasElement }) => {
    const review = within(canvasElement).getByRole('link', { name: 'Review 7 changes' });

    await expect(review).toHaveAttribute('href', '/publish');
    await expect(review).toHaveClass('btn-global');
  },
};

export const OneChange: Story = {
  name: 'One change',
  args: { count: 1, variant: 'global' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('link', { name: 'Review 1 change' })).toBeVisible();
  },
};

export const InCallout: Story = {
  name: 'In a callout',
  args: { count: 7, variant: 'secondary' },
};

export const Live: Story = {
  name: 'Live Snapshot',
  args: { count: 41, variant: 'live' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.status')).toHaveTextContent(/^Live: Snapshot #41$/);
  },
};
