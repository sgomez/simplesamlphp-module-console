import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';
import { hrPhp } from '../app/adapters/memory/pastedBoards';
import { hospitalXml } from '../app/adapters/memory/pastedSeveral';
import { ENTITY_TEXT, pasteInto, SP_ADD } from '../app/test/pasted';
import { StoryScreens } from '../app/test/StoryScreens';

const meta = {
  title: 'Pages/Add from pasted configuration',
  component: StoryScreens,
  parameters: { route: SP_ADD },
} satisfies Meta<typeof StoryScreens>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AddEmpty: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByRole('textbox', { name: ENTITY_TEXT })).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Review' })).toBeDisabled();
    await expect(page.queryByText('Detected')).toBeNull();
    await expect(page.getByRole('button', { name: 'Examples' })).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByLabelText('PHP array', { selector: 'pre' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Copy from External entities' })).toHaveAttribute('href', '/external');
    await expect(page.getByRole('link', { name: 'Paste' })).toHaveAttribute('aria-current', 'true');
  },
};

export const AddUnreadable: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await pasteInto(canvasElement, ENTITY_TEXT, hrPhp);

    await expect(page.getByRole('combobox')).toHaveValue('PHP array');
    fireEvent.click(page.getByRole('button', { name: 'Review' }));
    await expect(await page.findByRole('link', { name: 'Line 5' })).toBeVisible();
    await expect(page.getByText(/is a function call/)).toBeVisible();
    await expect(page.getByRole('textbox', { name: ENTITY_TEXT })).toHaveValue(hrPhp);
  },
};

export const AddWrongKind: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await pasteInto(canvasElement, ENTITY_TEXT, hospitalXml);

    await expect(page.getByRole('combobox')).toHaveValue('SAML metadata · 1 entity');
    fireEvent.click(page.getByRole('button', { name: 'Review' }));
    await expect(await page.findByText('This is an identity provider')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add as identity provider' })).toBeVisible();
    await expect(page.queryByRole('button', { name: 'Review' })).toBeNull();
  },
};

export const AddedAsOtherKind: Story = {
  name: 'Draft: Added as the kind it is',
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await pasteInto(canvasElement, ENTITY_TEXT, hospitalXml);
    fireEvent.click(page.getByRole('button', { name: 'Review' }));
    fireEvent.click(await page.findByRole('button', { name: 'Add as identity provider' }));

    await expect(await page.findByRole('heading', { name: 'Add identity provider' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: ENTITY_TEXT })).toHaveValue(hospitalXml);
  },
};

export const Upload: Story = {
  name: 'Draft: Upload',
  parameters: { route: `${SP_ADD}?source=upload` },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await expect(await page.findByRole('button', { name: 'Choose file' })).toBeVisible();
    const input = canvasElement.querySelector('input[type=file]') as HTMLInputElement;
    await userEvent.upload(input, new File([hospitalXml], 'idp.xml', { type: 'text/xml' }));

    await waitFor(() => expect(page.getByRole('textbox', { name: ENTITY_TEXT })).toHaveValue(hospitalXml));
  },
};

export const TooLarge: Story = {
  name: 'Draft: Larger than 1 MiB',
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await pasteInto(canvasElement, ENTITY_TEXT, `<md:EntitiesDescriptor>${' '.repeat(1024 * 1024)}</md:EntitiesDescriptor>`);

    await expect(await page.findByText('Larger than 1 MiB')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Review' })).toBeDisabled();
  },
};

export const NotRead: Story = {
  name: 'Draft: Not read',
  args: { pasted: { failure: { status: 500, body: null } } },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await pasteInto(canvasElement, ENTITY_TEXT, hrPhp);
    fireEvent.click(page.getByRole('button', { name: 'Review' }));

    await expect(await page.findByText('Not read: the server answered 500.')).toBeVisible();
  },
};
