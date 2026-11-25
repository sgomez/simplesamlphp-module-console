import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { StoryFrame } from '../app/test/StoryFrame';
import { NotFoundPage } from './NotFoundPage';
import { RequestRefusedPage } from './RequestRefusedPage';

type Shown = { page: 'refused' } | { page: 'not-found'; entityId?: string };

function Framed(shown: Shown) {
  if (shown.page === 'refused') {
    return (
      <StoryFrame crumbs={[{ label: 'Request refused' }]}>
        <RequestRefusedPage />
      </StoryFrame>
    );
  }
  const { entityId } = shown;
  const crumbs = entityId === undefined ? [] : [{ label: 'Service providers', to: '/entities/saml20-sp-remote' }];

  return (
    <StoryFrame crumbs={[...crumbs, { label: 'Not found' }]}>
      <NotFoundPage entityId={entityId} />
    </StoryFrame>
  );
}

const meta = {
  title: 'Pages/Failures',
  component: Framed,
} satisfies Meta<typeof Framed>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RequestRefused: Story = {
  name: 'Draft: Request refused',
  args: { page: 'refused' },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(page.getByText('Nothing was saved.')).toBeVisible();
    await expect(within(page.getByRole('main')).getByRole('link', { name: 'Back to the Console' })).toHaveAttribute('href', '/');
  },
};

export const NotFoundObject: Story = {
  name: 'Draft: Not found, object',
  args: { page: 'not-found', entityId: 'https://wiki.example.edu/shibboleth' },
  play: async ({ canvasElement }) => {
    const main = within(within(canvasElement).getByRole('main'));

    await expect(main.getByText(/No service provider has the entity ID/)).toBeVisible();
    await expect(main.getByRole('link', { name: 'Service providers' })).toBeVisible();
  },
};

export const NotFoundPath: Story = {
  name: 'Draft: Not found, path',
  args: { page: 'not-found' },
  parameters: { route: '/x/y' },
  play: async ({ canvasElement }) => {
    const main = within(within(canvasElement).getByRole('main'));

    await expect(main.getByRole('link', { name: 'Back to the Console' })).toBeVisible();
  },
};
