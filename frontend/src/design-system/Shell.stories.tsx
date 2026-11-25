import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Page } from './Page';
import { Shell } from './Shell';

const viewport = { options: { phone: { name: '400 px', styles: { width: '400px', height: '700px' } } } };

const meta = {
  title: 'Design system/Shell',
  component: Shell,
  parameters: { viewport },
  args: {
    side: (
      <nav className="side-nav" aria-label="Main">
        <div className="side-body">
          <span className="nav-head">Side</span>
        </div>
      </nav>
    ),
    head: <span className="crumbs">Head</span>,
    children: (
      <Page>
        <h1 className="h1">Content</h1>
      </Page>
    ),
  },
} satisfies Meta<typeof Shell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Slots: Story = {
  play: async ({ canvasElement }) => {
    const shell = canvasElement.querySelector('.shell') as HTMLElement;
    const [side, main] = [...shell.children] as HTMLElement[];

    await expect(side).toHaveAttribute('id', 'nav');
    await expect(side).toHaveClass('shell-side', { exact: true });
    await expect(within(side as HTMLElement).getByRole('navigation', { name: 'Main' })).toBeVisible();
    await expect(main).toHaveClass('shell-main');
    await expect([...(main?.children ?? [])].map((child) => child.className)).toEqual(['shell-head', 'page']);
    await expect(within(canvasElement).getByText('Head').parentElement).toHaveClass('shell-head');
    await expect(shell.querySelector('.menu-btn')).not.toBeVisible();
  },
};

export const Phone: Story = {
  name: 'Phone width, the sidebar as an overlay',
  globals: { viewport: { value: 'phone' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const menu = canvas.getByRole('button', { name: 'Menu' });
    const side = canvasElement.querySelector('#nav') as HTMLElement;

    await expect(side).not.toBeVisible();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(menu);
    await waitFor(() => expect(side).toHaveClass('shell-side is-open', { exact: true }));
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(side).toBeVisible();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(side).not.toBeVisible());
  },
};
