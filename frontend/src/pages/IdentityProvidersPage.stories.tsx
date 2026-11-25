import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { StoryScreens } from '../app/test/StoryScreens';

const meta = {
  title: 'Pages/Identity providers',
  component: StoryScreens,
  parameters: { route: '/entities/saml20-idp-remote' },
} satisfies Meta<typeof StoryScreens>;

export default meta;

type Story = StoryObj<typeof meta>;

export const List: Story = {
  name: 'Draft: List',
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByText('Partner university')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Identity providers' })).toBeVisible();
    await expect(page.getByText('1 to 6 of 6 identity providers')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Add identity provider' })).toHaveAttribute('href', '/entities/saml20-idp-remote/new');
    await expect(page.getByRole('link', { name: /Partner university/ })).toHaveAttribute(
      'href',
      '/entities/saml20-idp-remote/edit?entityid=https%3A%2F%2Fidp.partner.example.org%2Fidp%2Fshibboleth',
    );
  },
};

export const NoMatch: Story = {
  name: 'Draft: No match',
  parameters: { route: '/entities/saml20-idp-remote?q=zoom' },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByRole('heading', { name: 'No identity provider matches “zoom”' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Search External entities' })).toHaveAttribute('href', '/external?set=saml20-idp-remote&q=zoom');
  },
};

export const Hosted: Story = {
  name: 'Draft: Hosted IdP',
  parameters: { route: '/entities/saml20-idp-hosted' },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByText('University login')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Hosted IdP' })).toBeVisible();
    await expect(page.getByText('1 to 1 of 1 hosted IdP')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Hosted IdP' })).toHaveAttribute('aria-current', 'page');
  },
};

export const HostedEmpty: Story = {
  name: 'Draft: No hosted IdP',
  parameters: { route: '/entities/saml20-idp-hosted' },
  args: { sets: { 'saml20-idp-hosted': { rows: [] } } },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole('heading', { name: 'No hosted IdPs yet' })).toBeVisible();
  },
};
