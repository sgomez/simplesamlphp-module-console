import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Pre } from './Code';
import { Disclosure } from './Disclosure';

const meta = {
  title: 'Design system/Disclosure',
  component: Disclosure,
  parameters: { layout: 'padded' },
  args: {
    summary: 'Technical detail',
    children: <Pre label="Technical detail">SQLSTATE[HY000] [2002] Connection refused</Pre>,
  },
} satisfies Meta<typeof Disclosure>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Folded: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    const trigger = page.getByRole('button', { name: 'Technical detail' });

    await expect(trigger.closest('.grp')).toHaveClass('grp');
    await expect(trigger.closest('.grp')).not.toHaveClass('card');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(within(trigger).getByText('Technical detail')).toHaveClass('small');
    await expect(page.queryByLabelText('Technical detail', { selector: 'pre' })).not.toBeVisible();
  },
};

export const Card: Story = {
  args: {
    card: true,
    summary: '2 warnings',
    children: (
      <>
        <p className="msg-warning">The certificate expires in 12 days.</p>
        <p className="msg-warning">Two entities share a certificate.</p>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: '2 warnings' });
    const group = trigger.closest('.grp');

    await expect(group).toHaveClass('grp card');
    await expect(within(trigger).getByText('2 warnings')).toHaveClass('row-name');
    await userEvent.click(trigger);
    await expect(group?.querySelector('.grp-body')).toBeVisible();
    await expect(group).toHaveAttribute('data-expanded', 'true');
  },
};

export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    const trigger = page.getByRole('button', { name: 'Technical detail' });
    await userEvent.tab();
    await expect(trigger).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const panel = page.getByRole('group', { name: 'Technical detail' });
    await expect(panel).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-controls', panel.id);

    await userEvent.keyboard(' ');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).not.toBeVisible();
    await expect(trigger).toHaveFocus();
  },
};
