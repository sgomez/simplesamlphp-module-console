import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fireEvent, within } from 'storybook/test';
import { boardMigrations, boardRefusal, memoryDatabase, type MemoryDatabase } from '../app/adapters/memory/database';
import { memoryEntities } from '../app/adapters/memory/entities';
import { boardList } from '../app/adapters/memory/rows';
import { StoryFrame } from '../app/test/StoryFrame';
import { PageNotice } from '../design-system/Page';
import { RunMessage, stateCrumb, type DatabaseRefusal, type MigrationRun } from '../domain/database';
import { DatabaseStatePage } from './DatabaseStatePage';
import { EntityListPage } from './EntityListPage';

interface Frame {
  // The state the run left the database in; null: ready, so the requested screen shows.
  after: DatabaseRefusal | null;
  run?: MigrationRun;
  database?: MemoryDatabase;
}

function Framed({ after, run, database }: Frame) {
  const [ports] = useState(() => ({ database: memoryDatabase(database), entities: memoryEntities({ rows: boardList }) }));
  const crumb = after === null ? 'Service providers' : stateCrumb(after);

  return (
    <StoryFrame crumbs={[{ label: crumb }]} {...(after === null ? {} : { counts: {} })} {...ports}>
      <PageNotice value={run && <RunMessage run={run} />}>
        {after === null ? <EntityListPage set="saml20-sp-remote" /> : <DatabaseStatePage refusal={after} run={run ?? null} onRun={() => undefined} />}
      </PageNotice>
    </StoryFrame>
  );
}

const meta = {
  title: 'Pages/Run migrations',
  component: Framed,
  parameters: { route: '/entities/saml20-sp-remote' },
} satisfies Meta<typeof Framed>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Applied: Story = {
  name: 'Draft: Applied',
  args: { after: null, run: { outcome: 'Applied', applied: [7, 8, 9], failed: null, reason: null } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('Migrations applied: 7, 8, 9.');
  },
};

export const UpToDate: Story = {
  name: 'Review: Already up to date',
  args: { after: null, run: { outcome: 'Applied', applied: [], failed: null, reason: null } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('The database schema is already up to date.');
  },
};

export const Concurrent: Story = {
  name: 'Draft: Lost to a concurrent run',
  args: {
    after: boardRefusal({ missing: boardMigrations.slice(2) }),
    run: { outcome: 'Concurrent', applied: [], failed: null, reason: 'Another run is applying the migrations at the same time.' },
  },
};

const REASON = "SQLSTATE[42S01]: Base table or view already exists: 1050 Table 'console_audit' already exists";

export const Failed: Story = {
  name: 'Draft: Failed',
  args: { after: boardRefusal(), run: { outcome: 'Failed', applied: [], failed: boardMigrations[0] ?? null, reason: REASON } },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(page.getByRole('alert')).toHaveTextContent('Migration 7 failed: Create console_audit');
    await expect(canvasElement.querySelector('.card-list .status')).toHaveTextContent('Failed');
  },
};

export const FailedOutside: Story = {
  name: 'Draft: Failed outside a migration',
  args: { after: null, run: { outcome: 'Failed', applied: [7, 8, 9], failed: null, reason: 'The Audit trail row failed: disk full' } },
};

async function update(canvasElement: HTMLElement, text: string) {
  const page = within(canvasElement);
  // A click without focus: a focused button that stops pending leaves an announcement behind for the next story's axe check.
  fireEvent.click(page.getByRole('button', { name: 'Update database' }));

  await expect(await page.findByRole('alert')).toHaveTextContent(text);
}

export const NotRun: Story = {
  name: 'Draft: Not run, server error',
  args: { after: boardRefusal(), database: { failure: { status: 500, body: null } } },
  parameters: { screenshot: 'after-play' },
  play: ({ canvasElement }) => update(canvasElement, 'Migrations not run: the server answered 500.'),
};

export const Unreachable: Story = {
  name: 'Draft: Not run, no answer',
  args: { after: boardRefusal(), database: { failure: { status: 0, body: null } } },
  parameters: { screenshot: 'after-play' },
  play: ({ canvasElement }) => update(canvasElement, 'Migrations not run: the Console could not be reached.'),
};
