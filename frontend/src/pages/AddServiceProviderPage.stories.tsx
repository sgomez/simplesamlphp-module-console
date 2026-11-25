import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, within } from 'storybook/test';
import { boardPhp, boardXml } from '../app/adapters/memory/added';
import { MOODLE } from '../app/adapters/memory/edited';
import { ADD_ROUTE, AddFrame, paste } from '../app/test/AddFrame';

const meta = {
  title: 'Pages/Add service provider',
  component: AddFrame,
  parameters: { route: ADD_ROUTE, screenshot: 'after-play' },
} satisfies Meta<typeof AddFrame>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AddEntity: Story = {
  play: async ({ canvasElement }) => {
    await paste(canvasElement, boardXml);
    const page = within(canvasElement);

    await expect(page.getByRole('combobox', { name: 'Detected' })).toHaveValue('SAML metadata · 1 entity');
    await expect(page.getByRole('button', { name: 'Review' })).toBeEnabled();
    await expect(page.getByRole('link', { name: 'Copy from External entities' })).toHaveAttribute('href', '/external');
  },
};

export const NothingPasted: Story = {
  name: 'Draft: Nothing pasted',
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByRole('button', { name: 'Review' })).toBeDisabled();
    await expect(page.queryByRole('combobox', { name: 'Detected' })).toBeNull();
  },
};

export const PhpArray: Story = {
  name: 'Draft: PHP array detected',
  play: async ({ canvasElement }) => {
    await paste(canvasElement, boardPhp);

    await expect(within(canvasElement).getByRole('combobox', { name: 'Detected' })).toHaveValue('PHP array');
  },
};

export const Upload: Story = {
  name: 'Draft: Upload',
  parameters: { route: `${ADD_ROUTE}?source=upload` },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByRole('button', { name: 'Choose file' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Upload' })).toHaveAttribute('aria-current', 'true');
  },
};

export const Reviewed: Story = {
  name: 'Draft: Reviewed, the editor filled and unsaved',
  play: async ({ canvasElement }) => {
    await paste(canvasElement, boardXml);
    const page = within(canvasElement);
    fireEvent.click(page.getByRole('button', { name: 'Review' }));

    await expect(((await page.findByRole('textbox', { name: 'PHP' })) as HTMLTextAreaElement).value).toContain('Travelbooker');
    await expect(page.getByText('Unsaved')).toBeVisible();
  },
};

export const NotRead: Story = {
  name: 'Draft: Not read, server error',
  args: { entities: { pasted: () => ({ ok: false, status: 500, body: null }) } },
  play: async ({ canvasElement }) => {
    await paste(canvasElement, boardXml);
    const page = within(canvasElement);
    fireEvent.click(page.getByRole('button', { name: 'Review' }));

    await expect(await page.findByText('Not read: the server answered 500.')).toBeVisible();
  },
};

export const StartEmpty: Story = {
  name: 'Draft: Start empty (draft 07)',
  parameters: { route: `${ADD_ROUTE}?source=empty` },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole('textbox', { name: 'PHP' })).toBeVisible();
  },
};

export const Served: Story = {
  name: 'Draft: As the API serves it today, Start empty only',
  args: { entities: { served: true } },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByRole('textbox', { name: 'PHP' })).toBeVisible();
    await expect(page.queryByRole('link', { name: 'Paste' })).toBeNull();
  },
};

export const Exists: Story = {
  name: 'Draft: Entity ID already exists',
  args: {
    entities: {
      served: true,
      save: () => ({
        kind: 'invalid',
        refusal: {
          readable: true,
          notices: [],
          errors: [
            {
              pointer: '',
              message: 'A service provider with this entity ID already exists.',
              line: 1,
              column: null,
              existing: { entityId: MOODLE, name: 'Moodle' },
            },
          ],
        },
      }),
    },
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await page.findByRole('textbox', { name: 'PHP' });
    fireEvent.click(page.getByRole('button', { name: 'Save' }));

    await expect(await page.findByRole('link', { name: 'Open Moodle' })).toBeVisible();
  },
};
