import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Skeleton } from './Skeleton';

const meta = {
  title: 'Design system/Skeleton',
  component: Skeleton,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  play: async ({ canvasElement }) => {
    const busy = within(canvasElement).getByRole('status', { name: 'Loading' });
    const bars = [...busy.querySelectorAll<HTMLElement>('.skel')];

    await expect(busy).toHaveAttribute('aria-busy', 'true');
    await expect(busy).toHaveClass('card card-list', { exact: true });
    await expect(bars.map((bar) => bar.className)).toEqual(['skel skel-34', 'skel skel-62', 'skel skel-26', 'skel skel-54']);
    await expect(bars.map((bar) => getComputedStyle(bar).animationName)).toEqual(['none', 'none', 'none', 'none']);
    await expect(bars.map((bar) => getComputedStyle(bar).transitionDuration)).toEqual(['0s', '0s', '0s', '0s']);
  },
};
