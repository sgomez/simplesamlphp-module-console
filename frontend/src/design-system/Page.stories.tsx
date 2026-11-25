import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Button } from './Button';
import { Callout } from './Callout';
import { Card } from './Card';
import { Page, PageNotice } from './Page';

const content = (
  <>
    <h1 className="h1">Service providers</h1>
    <Card list>
      <div className="row">Moodle</div>
    </Card>
  </>
);

const meta = {
  title: 'Design system/Page',
  component: Page,
  args: { children: content },
} satisfies Meta<typeof Page>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const main = within(canvasElement).getByRole('main');

    await expect(main).toHaveClass('page', { exact: true });
    await expect(getComputedStyle(main).maxWidth).toBe('1040px');
  },
};

const widths = { narrow: '760px', wide: '1240px', publish: '1180px' } as const;

function width(name: keyof typeof widths): Story {
  return {
    args: { width: name },
    play: async ({ canvasElement }) => {
      const main = within(canvasElement).getByRole('main');

      await expect(main).toHaveClass(`page page-${name}`, { exact: true });
      await expect(getComputedStyle(main).maxWidth).toBe(widths[name]);
    },
  };
}

export const Narrow = width('narrow');
export const Wide = width('wide');
export const Publish = width('publish');

export const WithBar: Story = {
  name: 'With a bar',
  args: {
    bar: (
      <div className="save-bar">
        <Button variant="primary">Save</Button>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const main = within(canvasElement).getByRole('main');

    await expect(main.nextElementSibling).toHaveClass('save-bar');
    await expect(main.querySelector('.save-bar')).toBeNull();
  },
};

export const WithNotice: Story = {
  name: 'With a notice',
  decorators: [
    (Story) => (
      <PageNotice value={<Callout kind="success" title="Deleted." />}>
        <Story />
      </PageNotice>
    ),
  ],
  play: async ({ canvasElement }) => {
    const main = within(canvasElement).getByRole('main');

    await expect(main.firstElementChild).toBe(within(main).getByRole('status'));
    await expect(main.firstElementChild).toHaveTextContent('Deleted.');
  },
};
