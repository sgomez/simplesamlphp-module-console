import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { memoryEntities, type MemoryEntities } from '../app/adapters/memory/entities';
import { boardRows, row } from '../app/adapters/memory/rows';
import { StoryFrame } from '../app/test/StoryFrame';
import { StoryMessages } from '../app/test/StoryMessages';
import { ConfirmDialog } from '../design-system/ConfirmDialog';
import { ServiceProvidersPage } from './ServiceProvidersPage';

const BAD = 'https://bad.example.org/sp';
const SERVED = ' Nodes keep serving it until the next Publication, which withdraws it.';

interface Shown {
  text: string;
  confirm: string;
}

interface Frame {
  inSnapshot?: boolean;
  removal?: MemoryEntities['removal'];
  // A variant under review, drawn over the list in place of the one the Console shows.
  review?: Shown;
}

function Framed({ inSnapshot = false, removal, review }: Frame) {
  const unreadable = row(BAD, { state: 'Unreadable', unreadable: true, inSnapshot, error: 'The stored document is not valid JSON.' });
  const [port] = useState(() => memoryEntities({ rows: [unreadable, ...boardRows.slice(0, 3)], ...(removal ? { removal } : {}) }));
  const noop = () => undefined;

  return (
    <StoryFrame crumbs={[{ label: 'Service providers' }]} pending={2} entities={port}>
      <StoryMessages>
        <ServiceProvidersPage />
      </StoryMessages>
      {review && (
        <ConfirmDialog open title={`Delete ${BAD}?`} cancel="Cancel" {...review} onCancel={noop} onConfirm={noop} />
      )}
    </StoryFrame>
  );
}

const meta = {
  title: 'Pages/Delete',
  component: Framed,
  parameters: { route: '/entities/saml20-sp-remote?q=example', screenshot: 'after-play' },
} satisfies Meta<typeof Framed>;

export default meta;

type Story = StoryObj<typeof meta>;

async function ask(canvas: HTMLElement): Promise<HTMLElement> {
  const page = within(canvas);
  await userEvent.click(await page.findByRole('button', { name: 'Delete…' }));

  return page.findByRole('dialog', { name: `Delete ${BAD}?` });
}

async function confirm(canvas: HTMLElement): Promise<void> {
  await userEvent.click(within(await ask(canvas)).getByRole('button', { name: `Delete ${BAD}` }));
}

export const NotInSnapshot: Story = {
  name: 'Draft: Unreadable, never published',
  play: async ({ canvasElement }) => {
    const dialog = await ask(canvasElement);

    await expect(within(dialog).getByText(`${BAD} is removed from the Console.`)).toBeVisible();
    await expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
  },
};

export const InSnapshot: Story = {
  name: 'Draft: Unreadable, in the Snapshot',
  args: { inSnapshot: true },
  play: async ({ canvasElement }) => {
    const dialog = await ask(canvasElement);

    await expect(within(dialog).getByText(`${BAD} is removed from the Console.${SERVED}`)).toBeVisible();
  },
};

export const Deleting: Story = {
  name: 'Draft: Deleting',
  args: { removal: 'pending' },
  play: async ({ canvasElement }) => {
    await confirm(canvasElement);

    await expect(within(canvasElement).getByRole('button', { name: `Delete ${BAD}` })).toHaveAttribute('data-pending', 'true');
  },
};

export const Deleted: Story = {
  name: 'Draft: Deleted',
  play: async ({ canvasElement }) => {
    await confirm(canvasElement);
    const page = within(canvasElement);

    await expect(await page.findByRole('status')).toHaveTextContent('Deleted.');
    await expect(page.queryByText('Unreadable')).toBeNull();
  },
};

export const NotDeleted: Story = {
  name: 'Draft: Not deleted',
  args: { removal: { status: 500, body: {} } },
  play: async ({ canvasElement }) => {
    await confirm(canvasElement);

    await expect(await within(canvasElement).findByRole('alert')).toHaveTextContent('Not deleted: the server answered 500.');
  },
};

export const ReviewPlainButton: Story = {
  name: 'Review: Delete without the name',
  args: { review: { text: `${BAD} is removed from the Console.`, confirm: 'Delete' } },
};

export const ReviewLongText: Story = {
  name: 'Review: Nodes sentence out of the Snapshot',
  args: { review: { text: `${BAD} is removed from the Console.${SERVED}`, confirm: `Delete ${BAD}` } },
};
