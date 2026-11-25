import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Card } from './Card';
import { Diff } from './Diff';
import { RowDisclosure } from './RowDisclosure';

function Rows() {
  return (
    <Card>
      <RowDisclosure head={<span className="row-name">Library catalogue</span>}>
        <Diff lines={[{ kind: 'add', text: "'validate.authnrequest' => true," }]} />
      </RowDisclosure>
      <RowDisclosure head={<span className="row-name">Moodle</span>}>
        <Diff lines={[{ kind: 'del', text: "'attributes' => ['uid']," }]} />
      </RowDisclosure>
    </Card>
  );
}

const meta = {
  title: 'Design system/Row disclosure',
  component: Rows,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Rows>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Folded: Story = {
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Library catalogue' });

    await expect(trigger.closest('.grp')).toHaveClass('grp grp-row');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(getComputedStyle(trigger).borderRadius).toBe('0px');
    await expect(getComputedStyle(trigger.closest('.grp') as Element).borderTopWidth).toBe('0px');
  },
};

export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    const second = page.getByRole('button', { name: 'Moodle' });
    second.focus();
    await expect(getComputedStyle(second.closest('.grp') as Element).borderTopWidth).toBe('1px');

    await userEvent.keyboard('{Enter}');
    await expect(second).toHaveAttribute('aria-expanded', 'true');
    const body = second.closest('.grp')?.querySelector('.grp-body') as HTMLElement;
    await expect(body).toBeVisible();
    await expect(getComputedStyle(body).paddingInlineStart).toBe('46px');
  },
};
