import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { boardSources } from '../app/adapters/memory/external';
import { StoryScreens } from '../app/test/StoryScreens';

const meta = {
  title: 'Pages/External entities',
  component: StoryScreens,
  parameters: { route: '/external' },
} satisfies Meta<typeof StoryScreens>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Board: Story = {
  parameters: { screenshot: 'after-play' },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await expect(await page.findByRole('heading', { name: 'Federation feed' })).toBeVisible();
    for (const name of ['E-journals', 'Lab booking', 'Video conferencing']) {
      await userEvent.click(page.getByRole('checkbox', { name: `Select ${name}` }));
    }

    await expect(page.getByRole('checkbox', { name: 'Select Campus card' })).toBeDisabled();
    await expect(page.getByText('Expired 3 Nov 2026')).toBeVisible();
    await expect(page.getByText('1 to 25 of 2,941')).toBeVisible();
    await expect(page.getByText('12 · copy one at a time')).toBeVisible();
    await expect(page.getByText('3 selected')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Import 3' })).toBeVisible();
  },
};

export const NothingTicked: Story = {
  name: 'Draft: Nothing ticked',
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await expect(await page.findByRole('heading', { name: 'Federation feed' })).toBeVisible();

    await expect(page.queryByText(/selected$/)).toBeNull();
  },
};

export const AllInSource: Story = {
  name: 'Draft: All of a source ticked',
  parameters: { screenshot: 'after-play' },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await userEvent.click(await page.findByRole('checkbox', { name: 'Select all 2,941 in this source' }));

    await expect(page.getByRole('checkbox', { name: 'Select Alumni portal' })).toBeChecked();
    await expect(page.getByText('2,941 selected')).toBeVisible();
    await userEvent.click(page.getByRole('button', { name: 'Clear' }));
    await expect(page.queryByText('2,941 selected')).toBeNull();
    await userEvent.click(page.getByRole('checkbox', { name: 'Select all 2,941 in this source' }));
  },
};

export const Unreadable: Story = {
  name: 'Draft: Unreadable source',
  args: {
    overrides: {
      sources: [
        { heading: 'Database', location: 'pdo · mysql:host=db.example.edu;dbname=saml', importable: true, error: 'SQLSTATE[HY000] [2002] Connection refused', sets: {} },
        ...boardSources.slice(1),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByText('Source unreadable')).toBeVisible();
    await expect(page.getByText('SQLSTATE[HY000] [2002] Connection refused')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'File' })).toBeVisible();
  },
};

export const NoMatch: Story = {
  name: 'Draft: No match',
  parameters: { route: '/external?q=zoom' },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByRole('heading', { name: 'No external entity matches “zoom”' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Clear search' })).toHaveAttribute('href', '/external');
  },
};

export const IdentityProviders: Story = {
  name: 'Draft: Identity providers',
  parameters: { route: '/external?set=saml20-idp-remote' },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByText('Partner university')).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Set' })).toHaveValue('Identity providers');
    await expect(page.queryByRole('heading', { name: 'File' })).toBeNull();
  },
};
