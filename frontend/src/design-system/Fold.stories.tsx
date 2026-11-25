import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Card } from './Card';
import { Fold } from './Fold';

function Folds({ open }: { open: boolean }) {
  return (
    <Card list>
      <Fold summary={<span className="row-name">Moodle</span>} defaultExpanded={open}>
        <span className="small muted">No option changed</span>
      </Fold>
      <Fold summary={<span className="row-name">Old intranet</span>}>
        <span className="small muted">Disabled</span>
      </Fold>
    </Card>
  );
}

const meta = {
  title: 'Design system/Fold',
  component: Folds,
  parameters: { layout: 'padded' },
  args: { open: false },
} satisfies Meta<typeof Folds>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Folded: Story = {
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Moodle' });

    await expect(trigger.closest('.grp')).toHaveClass('grp fold');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    await expect(within(canvasElement).getByText('No option changed')).toBeVisible();
  },
};

export const Open: Story = {
  args: { open: true },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(page.getByRole('button', { name: 'Moodle' })).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('No option changed').closest('.grp-body')).toBeVisible();
  },
};

export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await userEvent.tab();
    await userEvent.tab();
    const trigger = page.getByRole('button', { name: 'Old intranet' });
    await expect(trigger).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('Disabled')).toBeVisible();
  },
};
