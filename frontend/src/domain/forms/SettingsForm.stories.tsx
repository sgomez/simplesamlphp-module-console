import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import {
  defaultSp,
  defaultSpIssues,
  formCapabilities,
  moodleEdited,
  moodleSaved,
  staffOrGuest,
} from '../../app/adapters/memory/forms';
import { Editing } from './test/Editing';

const meta = {
  title: 'Domain/Forms/Settings form',
  component: Editing,
  parameters: { layout: 'padded' },
  args: { capabilities: formCapabilities },
} satisfies Meta<typeof Editing>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ServiceProvider: Story = {
  name: 'Service provider (FormServiceProvider)',
  args: { set: 'saml20-sp-remote', initial: moodleEdited, saved: moodleSaved },
  play: async ({ canvasElement }) => {
    const form = within(canvasElement);

    await expect(form.getByRole('button', { name: /^Endpoints/ })).toHaveTextContent('2 of 3 set');
    await expect(form.getByText('Edited')).toBeVisible();
    await expect(form.getByText('CN=moodle.example.edu')).toBeVisible();
    await expect(form.getByText('Expires in 12 days.')).toBeVisible();
    await userEvent.click(form.getByRole('button', { name: 'Replace' }));
    await expect(form.getByRole('textbox', { name: 'Certificates, certificate 1, Certificate in PEM' })).toBeVisible();
  },
};

export const Authsource: Story = {
  name: 'Authsource saml:SP after a rejected save (Form)',
  args: { set: 'saml:SP', initial: defaultSp, issues: defaultSpIssues },
  play: async ({ canvasElement }) => {
    const form = within(canvasElement);
    const index = within(form.getByRole('navigation', { name: 'Groups on this page' }));

    await expect(form.getByText('Enter the full URL, starting with https://')).toBeVisible();
    await expect(form.getByLabelText('Discovery service URL')).toHaveAttribute('aria-invalid', 'true');
    await expect(form.getByText('Secret reference')).toBeVisible();
    await expect(index.getAllByText('1 error')).toHaveLength(2);
  },
};

export const MultiAuth: Story = {
  name: 'Authsource multiauth:MultiAuth (FormMultiAuth)',
  args: { set: 'multiauth:MultiAuth', initial: staffOrGuest },
  play: async ({ canvasElement }) => {
    const form = within(canvasElement);

    await expect(form.getByRole('button', { name: /^Sources/ })).toHaveTextContent('2 of 2 set');
    await expect(form.getByLabelText('Preselected source')).toHaveValue('university-ldap');
    await userEvent.click(form.getByRole('button', { name: 'Add source to Sources' }));
    await expect(form.getByRole('combobox', { name: 'Sources, source 3, Authsource' })).toHaveValue('');
  },
};
