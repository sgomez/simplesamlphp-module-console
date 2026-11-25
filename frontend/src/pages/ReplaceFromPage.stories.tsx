import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, userEvent, within } from 'storybook/test';
import { edited, MOODLE } from '../app/adapters/memory/edited';
import { hospitalXml, moodleXml } from '../app/adapters/memory/pastedSeveral';
import { heldReplacement, pasteInto } from '../app/test/pasted';
import { StoryScreens } from '../app/test/StoryScreens';

const PASTE = `/entities/saml20-sp-remote/replace?entityid=${encodeURIComponent(MOODLE)}`;
const REVIEW = `/entities/saml20-sp-remote/replace/review?entityid=${encodeURIComponent(MOODLE)}`;

const meta = {
  title: 'Pages/Replace from',
  component: StoryScreens,
  parameters: { route: REVIEW },
  args: {
    held: heldReplacement(REVIEW),
    sets: { 'saml20-sp-remote': { entities: [edited()] } },
  },
} satisfies Meta<typeof StoryScreens>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ReplaceFrom: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByRole('heading', { name: 'Replace Moodle' })).toBeVisible();
    await expect(page.getByText('From SAML metadata')).toBeVisible();
    await expect(page.getByText('This removes 4 options')).toBeVisible();
    await expect(page.getByText("'es' => 'Campus virtual',").closest('.dl')).toHaveClass('dl-del');
    await expect(page.getByRole('button', { name: 'Edit first' })).toBeVisible();
  },
};

export const Paste: Story = {
  name: 'Draft: Paste',
  parameters: { route: PASTE },
  args: { held: null },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByRole('heading', { name: 'Replace Moodle' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Metadata XML' })).toHaveValue('');
    await pasteInto(canvasElement, 'Metadata XML', moodleXml);
    await expect(page.queryByText('Detected')).toBeNull();
    fireEvent.click(page.getByRole('button', { name: 'Review' }));
    await expect(await page.findByText('This removes 4 options')).toBeVisible();
  },
};

export const Mismatch: Story = {
  name: 'Draft: Entity ID does not match',
  parameters: { route: PASTE },
  args: { held: null },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await pasteInto(canvasElement, 'Metadata XML', hospitalXml);
    fireEvent.click(page.getByRole('button', { name: 'Review' }));

    await expect(await page.findByText('The entity ID does not match')).toBeVisible();
    await expect(page.getByText('https://idp.hospital.example.org/idp/shibboleth')).toBeVisible();
  },
};

export const EditFirst: Story = {
  name: 'Draft: Edit first',
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await userEvent.click(await page.findByRole('button', { name: 'Edit first' }));

    await expect(await page.findByText('Unsaved edits')).toBeVisible();
    await expect((page.getByRole('textbox', { name: 'PHP' }) as HTMLTextAreaElement).value).toContain('MIIDdzCCAl+gAwIBAgIEbq9');
  },
};

export const Saved: Story = {
  name: 'Draft: Saved',
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    fireEvent.click(await page.findByRole('button', { name: 'Save' }));

    await expect(await page.findByText('Saved.')).toBeVisible();
    await expect(
      (
        (await page.findByRole('textbox', {
          name: 'PHP',
        })) as HTMLTextAreaElement
      ).value,
    ).toContain('MIIDdzCCAl+gAwIBAgIEbq9');
  },
};
