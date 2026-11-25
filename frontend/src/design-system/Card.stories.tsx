import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Card } from './Card';
import { Row } from './Row';

const meta = {
  title: 'Design system/Card',
  component: Card,
  parameters: { layout: 'padded' },
  args: { children: 'A surface' },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Surface: Story = {
  args: {
    children: (
      <div className="empty">
        <span>A surface</span>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.empty')?.parentElement).toHaveClass('card', { exact: true });
  },
};

export const List: Story = {
  args: {
    list: true,
    as: 'ul',
    children: ['Moodle', 'HR portal', 'Library'].map((name) => (
      <Row key={name} plain as="li">
        {name}
      </Row>
    )),
  },
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole('list');

    await expect(list).toHaveClass('card card-list', { exact: true });
    await expect(within(list).getAllByRole('listitem').map((item) => item.className)).toEqual(['row', 'row', 'row']);
  },
};
