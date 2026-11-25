import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { NavItem } from './NavItem';

function Items() {
  return (
    <nav className="nav-group" aria-label="Main">
      <NavItem to="/entities/saml20-sp-remote" label="Service providers" count={42} />
      <NavItem to="/external" label="External entities" count={3180} />
      <NavItem to="/publish" label="Publish" badge={{ count: 7, label: '7 changes to publish' }} />
      <NavItem to="/history" label="History" />
      <NavItem href="/simplesaml/module.php/admin/" label="Configuration" />
    </nav>
  );
}

const meta = {
  title: 'Design system/Navigation item',
  component: Items,
  parameters: { layout: 'padded', route: '/entities/saml20-sp-remote/edit' },
} satisfies Meta<typeof Items>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Entries: Story = {
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement);
    const current = nav.getByRole('link', { name: /Service providers/ });

    await expect(current).toHaveClass('nav-item active');
    await expect(current).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByText('3,180')).toHaveClass('nav-count');
    await expect(nav.getByLabelText('7 changes to publish')).toHaveTextContent('7');
    await expect(nav.getByRole('link', { name: 'Configuration' })).toHaveAttribute('href', '/simplesaml/module.php/admin/');

    await userEvent.tab();
    await expect(current).toHaveFocus();
  },
};
