import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { authsource, boardAuthsources } from '../app/adapters/memory/authsources';
import { disabled, warning } from '../app/adapters/memory/rows';
import { StoryScreens } from '../app/test/StoryScreens';

const meta = {
  title: 'Pages/Authsources',
  component: StoryScreens,
  parameters: { route: '/authsources' },
} satisfies Meta<typeof StoryScreens>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Board: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByRole('link', { name: /guest-sql/ })).toHaveAttribute('href', '/authsources/guest-sql/edit');
    await expect(page.getByText('Modified, not live')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'From authsources.php' })).toBeVisible();
    await expect(page.getByText('Replaces the managed one with this id')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Add authsource' })).toHaveAttribute('href', '/authsources/new');
  },
};

export const Labels: Story = {
  name: 'Draft: Row labels',
  args: {
    authsources: {
      list: {
        managed: [
          authsource('broken-ldap', 'ldap:Ldap', { state: 'Modified', labels: [{ text: 'Errors', kind: 'error', title: '/hostname: Missing.' }] }),
          authsource('default-sp', 'saml:SP', { labels: [warning('Shadowed', 'authsources.php has an authsource with this id, and the file wins.')] }),
          authsource('legacy-sql', 'sqlauth:SQL2', { state: 'Modified', labels: [disabled] }),
          authsource('mystery', 'saml:SP', { state: 'Unreadable', unreadable: true, error: 'The stored document is not valid JSON.' }),
          authsource('new-ldap', 'ldap:Ldap', { state: 'Unpublished' }),
        ],
        file: boardAuthsources.file,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await userEvent.click(await page.findByRole('button', { name: 'Delete…' }));

    await expect(await page.findByRole('dialog', { name: 'Delete mystery?' })).toBeVisible();
    await userEvent.click(page.getByRole('button', { name: 'Cancel' }));
    await expect(page.getByText('Disabled, not published')).toBeVisible();
    await expect(page.getByText('Shadowed')).toBeVisible();
  },
};

export const NoneManaged: Story = {
  name: 'Draft: None managed',
  args: { authsources: { list: { managed: [], file: [{ id: 'admin', type: 'core:AdminPassword', shadows: false }] } } },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByRole('heading', { name: 'No authsources yet' })).toBeVisible();
    await expect(page.getByText('core:AdminPassword')).toBeVisible();
  },
};
