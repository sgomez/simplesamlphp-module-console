import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { edited, formPhpRefusal, formPhpText, savedPhp, syntaxRefusal, syntaxText, unknownOption } from '../app/adapters/memory/edited';
import { EDIT_ROUTE, EditFrame, editAndSave } from '../app/test/EditFrame';

const meta = {
  title: 'Pages/Edit service provider',
  component: EditFrame,
  parameters: { route: EDIT_ROUTE },
} satisfies Meta<typeof EditFrame>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FormPhp: Story = {
  args: {
    entities: { entities: [edited({ php: formPhpText })], save: () => ({ kind: 'invalid', refusal: formPhpRefusal }) },
    pending: 7,
  },
  play: async ({ canvasElement }) => {
    await editAndSave(canvasElement);
    const page = within(canvasElement);

    await expect(await page.findByText('Not saved: 2 errors')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Line 9' })).toBeVisible();
    await expect(page.getByText('Unsaved edits')).toBeVisible();
  },
};

export const PhpSaved: Story = {
  args: {
    entities: {
      entities: [edited()],
      save: (_draft, stored) => ({
        kind: 'saved',
        entity: { ...edited(), ...stored, php: savedPhp, version: 5, notices: [unknownOption] },
        tidied: { comments: 2 },
      }),
    },
    pending: 8,
  },
  play: async ({ canvasElement }) => {
    await editAndSave(canvasElement);
    const page = within(canvasElement);
    await expect(await page.findByText('Saved. Not live yet.')).toBeVisible();
    await userEvent.type(page.getByRole('searchbox', { name: 'Search options' }), 'sign');

    await expect(page.getByText('Formatting was tidied and 2 comments were removed')).toBeVisible();
    await expect(page.getByRole('link', { name: 'sign.logout' })).toBeVisible();
    await expect(page.getByText('Saved, not live')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const PhpSyntax: Story = {
  args: {
    entities: { entities: [edited({ php: syntaxText })], save: () => ({ kind: 'invalid', refusal: syntaxRefusal }) },
    pending: 7,
  },
  play: async ({ canvasElement }) => {
    await editAndSave(canvasElement);
    const page = within(canvasElement);

    await expect(await page.findByText('Not saved: the text could not be read')).toBeVisible();
    await expect(page.getByText('Column 5: a comma is missing at the end of line 8.')).toBeVisible();
  },
};
