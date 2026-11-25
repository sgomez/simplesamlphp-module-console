import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, userEvent, within } from 'storybook/test';
import { boardImport } from '../app/adapters/memory/pastedSeveral';
import { StoryScreens } from '../app/test/StoryScreens';
import { importPath } from '../domain/overrides';

const TICKED = [
  'https://journals.publisher.example.com/shibboleth',
  'https://labs.partner.example.org/Shibboleth.sso/Metadata',
  'https://meet.vendor.example.com/saml2/sp',
];

const meta = {
  title: 'Pages/Import',
  component: StoryScreens,
  parameters: {
    route: importPath({
      set: 'saml20-sp-remote',
      sources: [{ position: 0, all: false, entityIds: TICKED }],
    }),
  },
} satisfies Meta<typeof StoryScreens>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Confirmation: Story = {
  name: 'Draft: Confirmation',
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByRole('heading', { level: 1, name: 'Import' })).toBeVisible();
    await expect(await page.findByText('Lab booking')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Federation feed' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Import 3' })).toBeEnabled();
  },
};

export const ImportResult: Story = {
  parameters: { route: '/external' },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await expect(await page.findByRole('heading', { name: 'Federation feed' })).toBeVisible();
    for (const name of ['E-journals', 'Lab booking', 'Video conferencing']) {
      await userEvent.click(page.getByRole('checkbox', { name: `Select ${name}` }));
    }
    await userEvent.click(page.getByRole('link', { name: 'Import 3' }));
    fireEvent.click(await page.findByRole('button', { name: 'Import 3' }));

    await expect(await page.findByText('3 imported, 1 skipped')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Review 10 changes' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'E-journals' })).toHaveAttribute(
      'href',
      '/entities/saml20-sp-remote/edit?entityid=https%3A%2F%2Fjournals.publisher.example.com%2Fshibboleth',
    );
    await expect(page.getByText('Already managed')).toBeVisible();
    await expect(page.getByText('Nothing imported came from a file')).toBeVisible();
    await expect(await page.findByRole('heading', { level: 1, name: 'External entities' })).toBeVisible();
  },
};

export const Shadowed: Story = {
  name: 'Draft: Imported entities are Shadowed',
  args: {
    overrides: {
      imported: {
        ...boardImport,
        created: boardImport.created.map((created) => ({
          ...created,
          collision: 'shadowed' as const,
        })),
        skipped: [],
        removable: [
          {
            location: 'metadata/saml20-sp-remote.php',
            entityIds: [TICKED[0] ?? ''],
          },
        ],
        shadowing: ['Federation feed'],
      },
    },
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    fireEvent.click(await page.findByRole('button', { name: 'Import 3' }));

    await expect(await page.findByText('3 imported')).toBeVisible();
    await expect(page.getByText('What was imported from Federation feed is Shadowed')).toBeVisible();
    await expect(page.getByText('Publishing changes nothing nodes serve until the originals are removed.')).toBeVisible();
  },
};
