import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Check } from './Check';
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

export const PickedRows: Story = {
  name: 'Rows with a checkbox',
  args: {
    list: true,
    children: ['Moodle', 'HR portal'].map((name) => (
      <Row key={name} to="#" wrap pick={<Check label={`Select ${name}`} hideLabel checked={false} onChange={() => undefined} />}>
        <span className="row-main">{name}</span>
      </Row>
    )),
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    const link = page.getByRole('link', { name: 'Moodle' });

    await expect(link).toHaveClass('row-target row-wrap', { exact: true });
    await expect(link.parentElement).toHaveClass('row row-wrap row-pick', { exact: true });
    await expect(link).not.toContainElement(page.getByRole('checkbox', { name: 'Select Moodle' }));
    await userEvent.tab();
    await expect(page.getByRole('checkbox', { name: 'Select Moodle' })).toHaveFocus();
    await userEvent.tab();
    await expect(link).toHaveFocus();
  },
};
