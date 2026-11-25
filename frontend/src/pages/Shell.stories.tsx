import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { memoryEntities } from '../app/adapters/memory/entities';
import { boardList } from '../app/adapters/memory/rows';
import { memorySession } from '../app/adapters/memory/session';
import { StoryFrame } from '../app/test/StoryFrame';
import type { Counts, SessionPort } from '../domain/session';
import { EntityListPage } from './EntityListPage';

interface Frame {
  pending: number;
  session?: SessionPort;
  counts?: Counts;
}

function Framed({ pending, session = memorySession, counts }: Frame) {
  const [port] = useState(() => memoryEntities({ rows: boardList, counts: { all: 42, 'not-live': 3, warnings: 1 } }));

  return (
    <StoryFrame crumbs={[{ label: 'Service providers' }]} pending={pending} entities={port} session={session} {...(counts ? { counts } : {})}>
      <EntityListPage set="saml20-sp-remote" />
    </StoryFrame>
  );
}

const meta = {
  title: 'Pages/Shell',
  component: Framed,
  parameters: { route: '/entities/saml20-sp-remote' },
} satisfies Meta<typeof Framed>;

export default meta;

type Story = StoryObj<typeof meta>;

function entries(canvas: HTMLElement): string[] {
  const nav = within(canvas).getByRole('navigation', { name: 'Main' });

  return [...nav.querySelectorAll('.nav-item > span:first-child')].map((label) => label.textContent);
}

export const Board: Story = {
  args: { pending: 7 },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await page.findByText('Course evaluations');

    await expect(entries(canvasElement)).toEqual([
      'Overview',
      'Service providers',
      'Identity providers',
      'Hosted IdP',
      'External entities',
      'Authsources',
      'Publish',
      'History',
      'Nodes',
      'Configuration',
      'Test authentication',
      'Federation',
    ]);
    await expect(page.getByText('3,180')).toBeVisible();
    await expect(page.getByLabelText('7 changes to publish')).toBeVisible();
  },
};

export const NavigationOpen: Story = {
  name: 'Navigation open',
  args: { pending: 7 },
  parameters: { screenshot: 'after-play' },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await page.findByText('Course evaluations');
    const menu = page.queryByRole('button', { name: 'Menu' });
    if (menu === null) {
      return;
    }

    await userEvent.click(menu);
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  },
};

export const Production: Story = {
  name: 'Draft: Milestone 1 server',
  args: { pending: 7, session: { screens: ['service-providers', 'publish'] }, counts: { 'saml20-sp-remote': 42 } },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('Course evaluations');

    await expect(entries(canvasElement)).toEqual(['Service providers', 'Publish', 'Configuration', 'Test authentication', 'Federation']);
  },
};

export const NoPendingChanges: Story = {
  name: 'No pending changes',
  args: { pending: 0 },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await page.findByText('Course evaluations');

    await expect(page.queryByRole('link', { name: /Review/ })).toBeNull();
    await expect(canvasElement.querySelector('.nav-badge')).toBeNull();
  },
};
