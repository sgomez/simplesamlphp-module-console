import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Status } from './Status';

const meta = {
  title: 'Design system/Status',
  component: Status,
  parameters: { layout: 'padded' },
  args: { tone: 'pending', mark: 'half', children: 'Modified, not live' },
} satisfies Meta<typeof Status>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PublishCycle: Story = {
  name: 'Publish cycle',
  render: () => (
    <div className="col-main">
      <Status tone="unsaved" mark="dot" note="only in this browser tab">
        Unsaved edits
      </Status>
      <Status tone="pending" mark="half" note="saved; waits for a Publication">
        Modified, not live
      </Status>
      <Status tone="pending" mark="dot">
        New, not published yet
      </Status>
      <Status tone="pending" mark="minus">
        Disabled, to be withdrawn
      </Status>
      <Status tone="live" mark="full" note="shown on the object, never in lists">
        Published
      </Status>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const statuses = [...canvasElement.querySelectorAll('.status')];

    await expect(statuses.map((status) => status.className)).toEqual([
      'status s-unsaved',
      'status s-pending',
      'status s-pending',
      'status s-pending',
      'status s-live',
    ]);
    await expect(statuses.map((status) => status.querySelector('.dot')?.className)).toEqual([
      'dot',
      'dot dot-half',
      'dot',
      'dot dot-minus',
      'dot dot-full',
    ]);
    await expect(within(canvasElement).getByText('only in this browser tab')).toHaveClass('small muted status-note');
  },
};

export const Problems: Story = {
  render: () => (
    <div className="col-main">
      <Status tone="danger" mark="cross">
        Not found on this node
      </Status>
      <Status tone="danger" mark="error">
        Errors
      </Status>
      <Status tone="warn" mark="warning" title="The certificate expires in 12 days.">
        Expiring
      </Status>
      <Status tone="off" mark="dot">
        Disabled
      </Status>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const statuses = [...canvasElement.querySelectorAll('.status')];

    await expect(statuses.map((status) => status.className)).toEqual(['status s-danger', 'status s-danger', 'status s-warn', 'status s-off']);
    await expect(statuses.map((status) => status.querySelector('svg')?.getAttribute('aria-hidden'))).toEqual(['true', 'true', 'true', undefined]);
    await expect(within(canvasElement).getByTitle('The certificate expires in 12 days.')).toHaveTextContent('Expiring');
  },
};
