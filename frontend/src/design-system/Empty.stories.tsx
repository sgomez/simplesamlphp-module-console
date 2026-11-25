import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { LinkButton } from './Button';
import { Empty } from './Empty';
import { Facts } from './Facts';

const meta = {
  title: 'Design system/Empty',
  component: Empty,
  parameters: { layout: 'padded' },
  args: { title: 'No service provider matches “zoom”' },
} satisfies Meta<typeof Empty>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithAction: Story = {
  name: 'With an action',
  args: { actions: <LinkButton to="/entities/saml20-sp-remote">Clear search</LinkButton> },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvasElement.firstElementChild).toHaveClass('card empty', { exact: true });
    await expect(canvas.getByRole('heading', { level: 2 })).toHaveTextContent('No service provider matches “zoom”');
    await expect(canvas.getByRole('link', { name: 'Clear search' }).parentElement).toHaveClass('empty-actions');
  },
};

export const WithoutAction: Story = {
  name: 'Without an action',
  args: { title: 'No service providers yet' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.empty-actions, .empty-text')).toBeNull();
  },
};

export const WithText: Story = {
  name: 'With a text',
  args: {
    state: true,
    title: 'Request refused',
    text: 'Nothing was saved.',
    actions: <LinkButton to="/">Back to the Console</LinkButton>,
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Nothing was saved.')).toHaveClass('muted empty-text');
  },
};

export const StatePage: Story = {
  name: 'State page',
  args: {
    state: true,
    title: 'SQLite too old',
    children: (
      <Facts
        facts={[
          { term: 'Found', value: '3.22.0', className: 'mono is-strong' },
          { term: 'Minimum', value: '3.24.0', className: 'mono' },
        ]}
      />
    ),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toHaveClass('card empty state-card', { exact: true });
    await expect(within(canvasElement).getByRole('heading', { level: 1 })).toHaveClass('h1');
  },
};

export const UnderCallout: Story = {
  name: 'State page under a callout',
  args: { state: true, flush: true, title: 'Database unreachable' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toHaveClass('card empty', { exact: true });
  },
};
