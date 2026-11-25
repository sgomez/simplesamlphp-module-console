import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { IdentityCard } from './IdentityCard';

const meta = {
  title: 'Design system/IdentityCard',
  component: IdentityCard,
  parameters: { layout: 'padded' },
  args: { identity: 'admin', logoutUrl: '/simplesaml/module.php/core/logout/admin' },
} satisfies Meta<typeof IdentityCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SignedIn: Story = {
  name: 'Signed in',
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    const logout = page.getByRole('link', { name: 'Log out' });

    await expect(page.getByText('admin')).toHaveClass('identity-name');
    await expect(page.getAllByRole('link')).toHaveLength(1);
    await expect(logout).toHaveClass('logout');
    await expect(logout).toHaveAttribute('href', '/simplesaml/module.php/core/logout/admin');
    await expect(logout).toHaveAttribute('title', 'Log out');
    await userEvent.tab();
    await expect(logout).toHaveFocus();
  },
};

export const LongIdentity: Story = {
  name: 'A long identity is cut',
  args: { identity: 'a.very.long.administrator.identity@sso.example.university.edu' },
  play: async ({ canvasElement }) => {
    const name = within(canvasElement).getByText(/^a\.very\.long/);

    await expect(getComputedStyle(name).textOverflow).toBe('ellipsis');
  },
};
