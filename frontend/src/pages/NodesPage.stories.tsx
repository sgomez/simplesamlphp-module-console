import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { boardNodes, nodeAgo, singleNode } from '../app/adapters/memory/nodes';
import { StoryScreens } from '../app/test/StoryScreens';

const meta = {
  title: 'Pages/Nodes',
  component: StoryScreens,
  parameters: { route: '/nodes' },
} satisfies Meta<typeof StoryScreens>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Board: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByText('Serves #39 · 2 behind')).toBeVisible();
    await expect(page.getByText('Last checked 3 hours ago')).toBeVisible();
    await expect(page.getByText('Serves #41 · 2 problems')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Problems on web-01' })).toBeVisible();
    await expect(page.getByLabelText('PHP', { selector: 'pre' })).toBeVisible();
  },
};

export const Single: Story = {
  args: { nodes: { list: singleNode } },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByText('One node. More appear here when they fetch a Snapshot.')).toBeVisible();
    await expect(page.getByText('This node')).toBeVisible();
    await expect(page.queryByRole('heading', { name: /^Problems on/ })).toBeNull();
  },
};

export const OtherNodeProblems: Story = {
  name: 'Draft: Problems on another node',
  args: {
    nodes: {
      list: {
        ...boardNodes,
        nodes: [
          { identifier: 'web-01', served: 41, checkedAt: nodeAgo(8), hasProblems: false, here: true },
          { identifier: 'web-02', served: 41, checkedAt: nodeAgo(30), hasProblems: true, here: false },
          { identifier: 'web-04', served: 41, checkedAt: nodeAgo(12 * 60), hasProblems: false, here: false },
        ],
        problems: [],
      },
    },
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByText('Serves #41 · has problems')).toBeVisible();
    await expect(page.getByText('Last checked 12 min ago')).toBeVisible();
    await expect(page.getByText('The problems of another node can only be read on that node.')).toBeVisible();
  },
};
