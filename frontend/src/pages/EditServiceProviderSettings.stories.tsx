import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, userEvent, within } from 'storybook/test';
import { settingsEntity, settingsRefusal } from '../app/adapters/memory/settings';
import { EDIT_ROUTE, EditFrame } from '../app/test/EditFrame';

const meta = {
  title: 'Pages/Edit service provider, Settings',
  component: EditFrame,
  parameters: { route: EDIT_ROUTE },
} satisfies Meta<typeof EditFrame>;

export default meta;

type Story = StoryObj<typeof meta>;

async function addAttribute(canvasElement: HTMLElement) {
  const page = within(canvasElement);
  await userEvent.click(await page.findByRole('button', { name: 'Add attribute to Attributes released' }));
  await userEvent.type(page.getByLabelText('Attributes released, attribute 4, Name'), 'eduPersonAffiliation');
  (document.activeElement as HTMLElement | null)?.blur();
}

export const FormServiceProvider: Story = {
  args: { entities: { entities: [settingsEntity()] }, pending: 7 },
  play: async ({ canvasElement }) => {
    await addAttribute(canvasElement);
    const page = within(canvasElement);

    await expect(page.getByRole('radio', { name: 'Settings' })).toBeChecked();
    await expect(page.getByText('Edited')).toBeVisible();
    await expect(page.getByText('Unsaved edits')).toBeVisible();
    await expect(page.getByText('CN=moodle.example.edu')).toBeVisible();
  },
};

export const Refused: Story = {
  name: 'Draft: Not saved, in the Settings view',
  args: { entities: { entities: [settingsEntity()], save: () => ({ kind: 'invalid', refusal: settingsRefusal }) }, pending: 7 },
  play: async ({ canvasElement }) => {
    await addAttribute(canvasElement);
    const page = within(canvasElement);
    fireEvent.click(page.getByRole('button', { name: 'Save' }));

    await expect(await page.findByText('Not saved: 1 error')).toBeVisible();
    await expect(page.getByRole('link', { name: 'attributes.NameFormat' })).toBeVisible();
    await expect(page.getAllByText('Not a URI the IdP understands.')).toHaveLength(2);
  },
};
