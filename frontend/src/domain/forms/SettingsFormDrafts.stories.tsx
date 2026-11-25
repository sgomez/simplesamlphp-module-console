import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { formCapabilities, hostedIdp, moodleSaved, staffOrGuest } from '../../app/adapters/memory/forms';
import { Editing } from './test/Editing';

const meta = {
  title: 'Domain/Forms/Settings form, drafts',
  component: Editing,
  parameters: { layout: 'padded' },
  args: { capabilities: formCapabilities },
} satisfies Meta<typeof Editing>;

export default meta;

type Story = StoryObj<typeof meta>;

export const New: Story = {
  name: 'Draft: New service provider',
  args: { set: 'saml20-sp-remote', initial: {} },
  play: async ({ canvasElement }) => {
    const form = within(canvasElement);

    await expect(form.getByText('Required')).toBeVisible();
    await expect(form.queryByRole('button', { name: 'Unset AssertionConsumerService' })).toBeNull();
    await userEvent.click(form.getByRole('button', { name: /^Request and session/ }));
    await userEvent.click(form.getByRole('button', { name: 'Add ForceAuthn' }));
    await waitFor(() => expect(form.getByRole('switch', { name: 'Always force re-authentication' })).toHaveFocus());
    await expect(form.getByRole('switch', { name: 'Always force re-authentication' })).toBeChecked();
  },
};

export const Finder: Story = {
  name: 'Draft: Finding an option',
  args: { set: 'saml20-idp-hosted', initial: { host: 'idp.example.org' } },
  play: async ({ canvasElement }) => {
    const form = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);

    await userEvent.keyboard('/');
    await expect(form.getByRole('combobox', { name: 'Find an option by name or title' })).toHaveFocus();
    await userEvent.keyboard('metadata');
    await expect(await page.findByRole('option', { name: /Metadata signature algorithm/ })).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(page.getByRole('option', { name: /Sign the published metadata/ }));
    await waitFor(() => expect(form.getByRole('switch', { name: 'Sign the published metadata' })).toHaveFocus());
  },
};

export const Conditional: Story = {
  name: 'Draft: Conditional options',
  args: { set: 'saml20-idp-hosted', initial: hostedIdp },
  play: async ({ canvasElement }) => {
    const form = within(canvasElement);

    await userEvent.click(form.getByRole('button', { name: /^and \d+ more/ }));
    await expect(form.getByRole('button', { name: 'Add metadata_sign_key' })).toBeVisible();
    await userEvent.click(form.getByRole('switch', { name: 'Sign the published metadata' }));
    await expect(form.queryByRole('button', { name: 'Add metadata_sign_key' })).toBeNull();
  },
};

export const Sensitive: Story = {
  name: 'Draft: Sensitive value',
  args: { set: 'saml20-idp-hosted', initial: hostedIdp },
  play: async ({ canvasElement }) => {
    const form = within(canvasElement);
    const field = form.getByLabelText('Private key passphrase');

    await expect(field).toHaveAttribute('type', 'password');
    await userEvent.click(form.getByRole('button', { name: 'Reveal' }));
    await expect(field).toHaveAttribute('type', 'text');
    await expect(field).toHaveValue('correct horse');
  },
};

export const Plain: Story = {
  name: 'Draft: Without the server’s lists',
  args: { set: 'multiauth:MultiAuth', initial: staffOrGuest, capabilities: {} },
  play: async ({ canvasElement }) => {
    const form = within(canvasElement);

    await expect(form.getByRole('textbox', { name: 'Sources, source 1, Authsource' })).toHaveValue('university-ldap');
  },
};

export const Uncataloged: Story = {
  name: 'Draft: Uncataloged options',
  args: { set: 'saml20-sp-remote', initial: { ...moodleSaved, extra: { 'sing.logout': true } } },
  play: async ({ canvasElement }) => {
    const form = within(canvasElement);
    const area = form.getByRole('textbox', { name: 'Uncataloged options' });

    await userEvent.type(area, '{{');
    await expect(form.getByText('The text is not valid JSON.')).toBeVisible();
  },
};
