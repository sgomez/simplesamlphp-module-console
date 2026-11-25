import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { LinkButton } from './Button';
import { Callout } from './Callout';

const meta = {
  title: 'Design system/Callout',
  component: Callout,
  parameters: { layout: 'padded' },
  args: { kind: 'info', title: 'This is an Override' },
} satisfies Meta<typeof Callout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Tones: Story = {
  render: () => (
    <div className="col-main">
      <Callout
        kind="success"
        title="Saved. Not live yet."
        action={
          <LinkButton to="/publish" small>
            Review
          </LinkButton>
        }
      >
        Moodle is now one of 7 changes waiting for review.
      </Callout>
      <Callout
        kind="info"
        title="This is an Override"
        action={
          <LinkButton href="#compare" small>
            Compare
          </LinkButton>
        }
      >
        It replaces the entity with the same ID from the federation feed.
      </Callout>
      <Callout kind="warning" title="Shadowed on this node">
        An external entity with the same ID wins here, so this one is ignored.
      </Callout>
      <Callout kind="error" title="Not saved: someone else changed this meanwhile">
        admin saved it 2 minutes ago. Your edits are kept below; review the differences and save again.
      </Callout>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const callouts = [...canvasElement.querySelectorAll('.callout')];

    await expect(callouts.map((callout) => callout.className)).toEqual([
      'callout callout-success',
      'callout callout-info',
      'callout callout-warning',
      'callout callout-error',
    ]);
    await expect(callouts.map((callout) => callout.querySelector('svg')?.getAttribute('class'))).toEqual([
      'ic ic-success',
      'ic ic-info',
      'ic ic-warning',
      'ic ic-error',
    ]);
    await expect(canvas.getAllByRole('status')).toHaveLength(3);
    await expect(canvas.getByRole('alert')).toHaveTextContent('Not saved: someone else changed this meanwhile');
    await expect(canvas.getByRole('link', { name: 'Review' })).toHaveClass('btn btn-secondary btn-sm');
  },
};

export const TitleOnly: Story = {
  args: { kind: 'success', title: 'Deleted.' },
  play: async ({ canvasElement }) => {
    const callout = within(canvasElement).getByRole('status');

    await expect(callout).toHaveTextContent('Deleted.');
    await expect(callout.querySelector('.small')).toBeNull();
  },
};

export const Items: Story = {
  args: {
    kind: 'error',
    title: 'Not published: 2 problems',
    items: ['Moodle: /AssertionConsumerService is missing.', 'Archive: the stored document is not valid JSON.'],
  },
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole('list');

    await expect(list).toHaveClass('callout-list');
    await expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  },
};
