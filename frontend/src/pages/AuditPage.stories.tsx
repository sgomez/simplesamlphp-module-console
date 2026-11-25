import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { boardEntries } from '../app/adapters/memory/audit';
import { StoryScreens } from '../app/test/StoryScreens';

const meta = {
  title: 'Pages/Audit trail',
  component: StoryScreens,
  parameters: { route: '/history/audit' },
} satisfies Meta<typeof StoryScreens>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Board: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await expect(await page.findByText('1 to 6 of 214')).toBeVisible();

    await expect(page.getByRole('link', { name: 'Audit trail' })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('button', { name: /Moodle/ })).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('button', { name: /Old intranet/ })).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByText('Page 1 of 36')).toBeVisible();
  },
};

export const SnapshotRows: Story = {
  name: 'Draft: Publication and Rollback rows',
  args: {
    audit: {
      anonymous: false,
      entries: [
        {
          id: 3,
          at: '2026-11-24T10:00:00',
          identity: 'jdoe',
          action: 'rollback',
          subject: { type: 'snapshot', from: 41, to: 40, comment: null, changes: null },
          diff: null,
          document: null,
          raw: false,
        },
        ...boardEntries.filter((entry) => entry.action === 'publish'),
        {
          id: 1,
          at: '2026-11-20T08:00:00',
          identity: 'jdoe',
          action: 'migrate',
          subject: { type: 'schema', version: 6 },
          diff: null,
          document: null,
          raw: false,
        },
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await userEvent.click(await page.findByRole('button', { name: /Rolled back/ }));
    await userEvent.click(page.getByRole('button', { name: /Published/ }));

    await expect(page.getByText('Snapshot #41 → #40')).toBeVisible();
    await expect(page.getByText('Autumn onboarding: travel and library')).toBeVisible();
    await expect(page.queryByText('SimpleSAMLphp has one administrator identity.')).toBeNull();
  },
};

export const FullDocument: Story = {
  name: 'Draft: Full document after a change',
  args: { audit: { entries: boardEntries.slice(0, 1) } },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await userEvent.click(await page.findByRole('button', { name: 'Full document after this change' }));

    await expect(page.getByLabelText('PHP', { selector: 'pre' })).toBeVisible();
  },
};

export const NoMatch: Story = {
  name: 'Draft: No match',
  parameters: { route: '/history/audit?object=zoom&action=delete' },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByRole('heading', { name: 'No change matches the filters' })).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Object' })).toHaveValue('zoom');
    await expect(page.getByRole('combobox', { name: 'Action' })).toHaveValue('Deleted');
  },
};
