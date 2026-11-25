import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { memoryEntities, type MemoryEntities } from '../app/adapters/memory/entities';
import { boardList, boardRows, row, warning } from '../app/adapters/memory/rows';
import { StoryFrame } from '../app/test/StoryFrame';
import { EntityListPage } from './EntityListPage';

interface Frame {
  entities: MemoryEntities;
  pending?: number;
}

function Framed({ entities, pending = 0 }: Frame) {
  const [port] = useState(() => memoryEntities(entities));

  return (
    <StoryFrame crumbs={[{ label: 'Service providers' }]} pending={pending} entities={port}>
      <EntityListPage set="saml20-sp-remote" />
    </StoryFrame>
  );
}

const meta = {
  title: 'Pages/Service providers',
  component: Framed,
  parameters: { route: '/entities/saml20-sp-remote' },
} satisfies Meta<typeof Framed>;

export default meta;

type Story = StoryObj<typeof meta>;

const LIST = '/entities/saml20-sp-remote';

export const Board: Story = {
  args: { entities: { rows: boardList, counts: { all: 42, 'not-live': 3, warnings: 1 } }, pending: 7 },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    const rows = (await page.findByText('Course evaluations')).closest('.card')?.querySelectorAll('a.row');

    await expect(rows).toHaveLength(12);
    await expect(page.getByRole('link', { name: 'Next' })).toBeVisible();
  },
};

export const NoMatch: Story = {
  name: 'No match',
  args: { entities: { rows: boardList }, pending: 7 },
  parameters: { route: `${LIST}?q=zoom` },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByRole('heading', { name: 'No service provider matches “zoom”' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Clear search' })).toBeVisible();
  },
};

export const Empty: Story = {
  name: 'Draft: Empty',
  args: { entities: { rows: [] } },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByRole('heading', { name: 'No service providers yet' })).toBeVisible();
    await expect(page.queryByRole('search')).toBeNull();
  },
};

export const FilterMatchesNothing: Story = {
  name: 'Draft: Filter matches nothing',
  args: { entities: { rows: boardRows.filter((entity) => entity.labels.length === 0) } },
  parameters: { route: `${LIST}?filter=warnings` },
  play: async ({ canvasElement }) => {
    const heading = await within(canvasElement).findByRole('heading', { name: 'No service provider matches the filter' });

    await expect(heading).toBeVisible();
  },
};

export const Unreadable: Story = {
  name: 'Draft: Unreadable row',
  args: {
    entities: {
      rows: [
        row('https://bad.example.org/sp', { state: 'Unreadable', unreadable: true, error: 'The stored document is not valid JSON.' }),
        ...boardRows.slice(0, 3),
      ],
    },
    pending: 2,
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await userEvent.click(await page.findByRole('button', { name: 'Delete…' }));

    await expect(await page.findByRole('dialog', { name: 'Delete https://bad.example.org/sp?' })).toBeVisible();
    await userEvent.click(page.getByRole('button', { name: 'Cancel' }));
    await expect(page.getByRole('button', { name: 'Delete…' })).toHaveFocus();
  },
};

export const Errors: Story = {
  name: 'Draft: Errors label',
  args: {
    entities: {
      rows: [
        row('https://broken.example.edu/sp', {
          name: 'Broken service',
          state: 'Modified',
          labels: [{ text: 'Errors', kind: 'error', title: '/AssertionConsumerService: Missing.' }, warning('Signing off', 'Responses are not signed.')],
        }),
        ...boardRows.slice(0, 3),
      ],
    },
    pending: 1,
  },
};

export const Unnamed: Story = {
  name: 'Draft: Unnamed row',
  args: { entities: { rows: [row('https://unnamed.example.edu/shibboleth'), ...boardRows.slice(0, 3)] } },
};

export const Loading: Story = {
  name: 'Draft: Loading',
  args: { entities: { pending: true } },
};

export const LastPage: Story = {
  name: 'Draft: Last page',
  args: { entities: { rows: boardList }, pending: 7 },
  parameters: { route: `${LIST}?page=4` },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByText('37 to 42 of 42 service providers')).toBeVisible();
  },
};

export const Thousands: Story = {
  name: 'Draft: Thousands',
  args: {
    entities: {
      rows: Array.from({ length: 1234 }, (_, n) => row(`https://sp-${n}.example.edu/sp`)),
    },
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByText('1 to 12 of 1,234 service providers')).toBeVisible();
    await expect(page.getByText('Page 1 of 103')).toBeVisible();
  },
};
