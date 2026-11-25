import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { boardSources } from '../app/adapters/memory/external';
import { StoryScreens } from '../app/test/StoryScreens';

const JOURNALS = 'https://journals.publisher.example.com/shibboleth';

const meta = {
  title: 'Pages/External entity',
  component: StoryScreens,
  parameters: { route: `/external/saml20-sp-remote?entityid=${encodeURIComponent(JOURNALS)}` },
} satisfies Meta<typeof StoryScreens>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Board: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByRole('heading', { name: 'E-journals', level: 1 })).toBeVisible();
    await expect(page.getByText('Read-only')).toBeVisible();
    await expect(page.getByText('metarefresh · https://mds.federation.example.org/sp.xml')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create managed copy' })).toHaveAttribute(
      'href',
      `/external/saml20-sp-remote/copy?entityid=${encodeURIComponent(JOURNALS)}&source=0`,
    );
    await expect(page.queryByText('Served')).toBeNull();
  },
};

const [feed, file] = boardSources;
const journals = feed?.sets['saml20-sp-remote']?.slice(2, 3) ?? [];

export const SeveralCopies: Story = {
  name: 'Draft: Several copies',
  args: {
    overrides: {
      sources: [
        { heading: 'File', location: 'metadata/saml20-sp-remote.php', importable: false, sets: { 'saml20-sp-remote': journals } },
        ...boardSources.filter((source) => source !== file),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await expect(await page.findByRole('heading', { name: 'E-journals', level: 1 })).toBeVisible();

    await expect(page.getAllByRole('heading', { name: 'PHP' })).toHaveLength(2);
    await expect(page.getByText('Served')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create managed copy' })).toHaveAttribute('href', expect.stringMatching(/&source=0$/));
  },
};
