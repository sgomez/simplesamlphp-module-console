import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { edited, unreadable } from '../app/adapters/memory/edited';
import { EDIT_ROUTE, EditFrame, editAndSave } from '../app/test/EditFrame';

const meta = {
  title: 'Pages/Edit service provider, drafts',
  component: EditFrame,
  parameters: { route: EDIT_ROUTE },
} satisfies Meta<typeof EditFrame>;

export default meta;

type Story = StoryObj<typeof meta>;


export const Opened: Story = {
  name: 'Draft: Opened with a Pending change',
  args: { entities: { entities: [edited()] }, pending: 7 },
};

export const Published: Story = {
  name: 'Draft: Published',
  args: { entities: { entities: [edited({ state: 'Up to date' })] } },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByText('Published')).toBeVisible();
    await expect(page.queryByRole('button', { name: 'Discard edits' })).toBeNull();
  },
};

export const Disabled: Story = {
  name: 'Draft: Disabled',
  args: { entities: { entities: [edited({ state: 'To be withdrawn', enabled: false })] }, pending: 1 },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole('switch', { name: 'Enabled' })).not.toBeChecked();
  },
};

export const SavedPublished: Story = {
  name: 'Draft: Saved, back to Published',
  args: {
    entities: { entities: [edited()], save: (_draft, stored) => ({ kind: 'saved', entity: { ...edited(), ...stored, state: 'Up to date' } }) },
  },
  play: async ({ canvasElement }) => {
    await editAndSave(canvasElement);
    await expect(await within(canvasElement).findByText('Saved.')).toBeVisible();
  },
};

export const LostRace: Story = {
  name: 'Draft: Lost race',
  args: {
    entities: {
      entities: [edited()],
      save: () => ({ kind: 'race', entity: edited({ version: 6 }), by: { identity: 'admin', at: new Date(Date.now() - 120000) } }),
    },
    pending: 7,
  },
  play: async ({ canvasElement }) => {
    await editAndSave(canvasElement);
    await expect(await within(canvasElement).findByText('admin saved it 2 minutes ago. Your edits were not kept.')).toBeVisible();
  },
};

export const LostRaceServed: Story = {
  name: 'Draft: Lost race, as the API answers today',
  args: { entities: { entities: [edited()], served: true, save: () => ({ kind: 'race', entity: edited({ version: 6 }) }) }, pending: 7 },
  play: async ({ canvasElement }) => {
    await editAndSave(canvasElement);
    await expect(await within(canvasElement).findByText('This is Moodle as it now stands. Your edits were not kept.')).toBeVisible();
  },
};

export const ServerError: Story = {
  name: 'Draft: Not saved, server error',
  args: { entities: { entities: [edited()], save: () => ({ kind: 'failed', failed: { status: 500, body: null } }) }, pending: 7 },
  play: async ({ canvasElement }) => {
    await editAndSave(canvasElement);
    await expect(await within(canvasElement).findByText('Not saved: the server answered 500.')).toBeVisible();
  },
};

export const SchemaErrors: Story = {
  name: 'Draft: Schema errors of the stored object',
  args: {
    entities: {
      entities: [edited({ errors: [{ pointer: '/AssertionConsumerService', message: 'At least one endpoint needs a binding SimpleSAMLphp uses for this service.', line: 6, column: null }] })],
    },
    pending: 7,
  },
};

export const Unreadable: Story = {
  name: 'Draft: Unreadable',
  args: { entities: { entities: [unreadable] }, pending: 7, title: unreadable.entityId },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByLabelText('Stored bytes')).toBeVisible();
  },
};

export const Loading: Story = {
  name: 'Draft: Loading',
  args: { entities: { entities: [edited()], reading: true }, pending: 7 },
};

export const Insert: Story = {
  name: 'Draft: Option inserted',
  args: { entities: { entities: [edited()] }, pending: 7 },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await userEvent.click(await page.findByRole('button', { name: 'Insert ForceAuthn' }));

    await expect((page.getByRole('textbox', { name: 'PHP' }) as HTMLTextAreaElement).value).toContain("    'ForceAuthn' => false,\n];");
    await expect(page.getByText('Line 24')).toBeVisible();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};
