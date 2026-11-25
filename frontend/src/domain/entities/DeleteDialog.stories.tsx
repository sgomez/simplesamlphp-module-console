import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, screen, userEvent, within } from 'storybook/test';
import { memoryEntities } from '../../app/adapters/memory/entities';
import { MenuButton } from '../../design-system/Menu';
import { EntitiesPortContext } from './port';
import { useDeleteEntity } from './useDeleteEntity';

const MOODLE = 'https://moodle.example.edu/auth/saml2/sp/metadata.php';
const SERVED = ' Nodes keep serving it until the next Publication, which withdraws it.';

interface Asked {
  name: string | null;
  inSnapshot: boolean;
}

function Asker(asked: Asked) {
  const deletion = useDeleteEntity({ entityId: MOODLE, ...asked }, '/');

  return (
    <>
      <MenuButton label="More actions" entries={[{ label: 'Delete…', onSelect: deletion.ask, danger: true }]} />
      {deletion.element}
    </>
  );
}

function Framed(asked: Asked) {
  const [port] = useState(() => memoryEntities({ removal: { status: 500, body: {} } }));

  return (
    <EntitiesPortContext value={port}>
      <Asker {...asked} />
    </EntitiesPortContext>
  );
}

const meta = {
  title: 'Domain/Entities/Delete dialog',
  component: Framed,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Framed>;

export default meta;

type Story = StoryObj<typeof meta>;

async function ask(canvas: HTMLElement): Promise<HTMLElement> {
  await userEvent.click(within(canvas).getByRole('button', { name: 'More actions' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete…' }));

  return screen.findByRole('dialog');
}

export const InSnapshot: Story = {
  name: 'Draft: In the Snapshot',
  args: { name: 'Moodle', inSnapshot: true },
  play: async ({ canvasElement }) => {
    const dialog = await ask(canvasElement);

    await expect(dialog).toHaveAccessibleName('Delete Moodle?');
    await expect(within(dialog).getByText(`Moodle is removed from the Console.${SERVED}`)).toBeVisible();
    await expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await expect(within(dialog).getByRole('button', { name: 'Delete Moodle' })).toHaveClass('btn-danger-solid');
  },
};

export const NotInSnapshot: Story = {
  name: 'Draft: Not in the Snapshot',
  args: { name: 'Moodle', inSnapshot: false },
  play: async ({ canvasElement }) => {
    const dialog = await ask(canvasElement);

    await expect(within(dialog).getByText('Moodle is removed from the Console.')).toBeVisible();
  },
};

export const Unnamed: Story = {
  name: 'Draft: Unnamed',
  args: { name: null, inSnapshot: true },
  play: async ({ canvasElement }) => {
    const dialog = await ask(canvasElement);

    await expect(dialog).toHaveAccessibleName(`Delete ${MOODLE}?`);
    await expect(within(dialog).getByRole('button', { name: `Delete ${MOODLE}` })).toBeVisible();
  },
};

export const Cancelled: Story = {
  args: { name: 'Moodle', inSnapshot: true },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(await ask(canvasElement)).getByRole('button', { name: 'Cancel' }));

    await expect(screen.queryByRole('dialog')).toBeNull();
    await expect(within(canvasElement).getByRole('button', { name: 'More actions' })).toHaveFocus();
  },
};

export const NotDeleted: Story = {
  name: 'Draft: Not deleted',
  args: { name: 'Moodle', inSnapshot: true },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(await ask(canvasElement)).getByRole('button', { name: 'Delete Moodle' }));

    await expect(await within(canvasElement).findByRole('alert')).toHaveTextContent('Not deleted: the server answered 500.');
  },
};
