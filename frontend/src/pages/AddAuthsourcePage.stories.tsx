import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { StoryScreens } from '../app/test/StoryScreens';

const meta = {
  title: 'Pages/Add authsource',
  component: StoryScreens,
  parameters: { route: '/authsources/new?source=empty' },
} satisfies Meta<typeof StoryScreens>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Board: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByRole('link', { name: 'Start empty' })).toHaveAttribute('aria-current', 'true');
    await expect(page.getByRole('link', { name: /saml:SP/ })).toHaveAttribute('href', '/authsources/new?type=saml%3ASP');
    await expect(page.getByText('Fixed test users. Not for production')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Authsources 5' })).toHaveAttribute('aria-current', 'page');
  },
};

export const Paste: Story = {
  name: 'Draft: Paste',
  parameters: { route: '/authsources/new' },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByRole('textbox', { name: 'PHP array' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Review' })).toBeDisabled();
  },
};

export const Upload: Story = {
  name: 'Draft: Upload',
  parameters: { route: '/authsources/new?source=upload' },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await expect(await page.findByRole('button', { name: 'Choose file' })).toBeVisible();
    const input = canvasElement.querySelector('input[type=file]') as HTMLInputElement;
    await userEvent.upload(input, new File(["$config['staff'] = ['ldap:Ldap'];"], 'authsources.php', { type: 'text/plain' }));

    await waitFor(() => expect(page.getByRole('textbox', { name: 'PHP array' })).toHaveValue("$config['staff'] = ['ldap:Ldap'];"));
    await expect(page.getByRole('link', { name: 'Paste' })).toHaveAttribute('aria-current', 'true');
  },
};
