import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { boardMigrations, boardRefusal, servedRefusal } from '../app/adapters/memory/database';
import { StoryFrame } from '../app/test/StoryFrame';
import { stateCrumb, type DatabaseRefusal } from '../domain/database';
import { DatabaseStatePage } from './DatabaseStatePage';

function Framed({ refusal }: { refusal: DatabaseRefusal }) {
  return (
    <StoryFrame crumbs={[{ label: stateCrumb(refusal) }]} counts={{}}>
      <DatabaseStatePage refusal={refusal} run={null} onRun={() => undefined} />
    </StoryFrame>
  );
}

const meta = {
  title: 'Pages/Database states',
  component: Framed,
} satisfies Meta<typeof Framed>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Board: Story = {
  args: { refusal: boardRefusal() },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(page.getByText(/^The module was upgraded to 1\.4\. Nodes keep serving Snapshot #41 meanwhile\./)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Update database' })).toBeVisible();
    await expect(page.getByText('3 steps')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: '3 migrations to apply' })).toBeVisible();
  },
};

export const Served: Story = {
  name: 'Draft: Milestone 1 server',
  args: { refusal: servedRefusal() },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('A migration cannot be undone without restoring a backup.')).toBeVisible();
  },
};

export const FreshInstall: Story = {
  name: 'Draft: Fresh install',
  args: {
    refusal: servedRefusal({
      moduleVersion: '1.4',
      highest: 0,
      missing: [{ number: 1, title: 'Create console_entity' }, { number: 2, title: 'Create console_authsource' }, ...boardMigrations],
    }),
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/^The module was upgraded to 1\.4\. A migration/)).toBeVisible();
  },
};

export const OneMigration: Story = {
  name: 'Draft: One migration',
  args: { refusal: boardRefusal({ highest: 8, missing: boardMigrations.slice(2) }) },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(page.getByText('1 step')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: '1 migration to apply' })).toBeVisible();
  },
};

export const Unreachable: Story = {
  name: 'Draft: Database unreachable',
  args: { refusal: boardRefusal({ state: 'Unreachable', missing: [], detail: 'SQLSTATE[HY000] [2002] Connection refused' }) },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(page.getByRole('heading', { level: 1, name: 'Database unreachable' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Technical detail' })).toHaveAttribute('aria-expanded', 'false');
  },
};

export const SqliteTooOld: Story = {
  name: 'Draft: SQLite too old',
  args: { refusal: boardRefusal({ state: 'SqliteTooOld', missing: [], sqliteVersion: '3.22.0' }) },
};

export const ConsoleOlder: Story = {
  name: 'Draft: Console older than the database',
  args: { refusal: boardRefusal({ state: 'ConsoleOlder', missing: [], highest: 11 }) },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('button', { name: /Update/ })).toBeNull();
  },
};
