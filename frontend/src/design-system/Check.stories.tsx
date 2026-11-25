import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Check } from './Check';

const change = fn();

function Checkbox({ checked }: { checked: boolean }) {
  const [on, setOn] = useState(checked);

  return (
    <Check
      label="Checkbox"
      checked={on}
      onChange={(next) => {
        change(next);
        setOn(next);
      }}
    />
  );
}

const meta = {
  title: 'Design system/Check',
  component: Checkbox,
  parameters: { layout: 'padded' },
  args: { checked: true },
  beforeEach: () => {
    change.mockClear();
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Checked: Story = {
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole('checkbox', { name: 'Checkbox' });

    await expect(box).toHaveClass('check');
    await expect(box).toBeVisible();
    await expect(box).toBeChecked();
    await expect(box.closest('label')).toHaveClass('check-field');
    await userEvent.click(box);
    await expect(change).toHaveBeenCalledWith(false);
    await expect(box).not.toBeChecked();
  },
};

export const Unchecked: Story = {
  args: { checked: false },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(page.getByRole('checkbox', { name: 'Checkbox' })).not.toBeChecked();
    await userEvent.click(page.getByText('Checkbox'));
    await expect(change).toHaveBeenCalledWith(true);
  },
};

export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole('checkbox', { name: 'Checkbox' });

    await userEvent.tab();
    await expect(box).toHaveFocus();
    await expect(box).toHaveStyle({ outlineStyle: 'solid' });
    await userEvent.keyboard(' ');
    await expect(change).toHaveBeenCalledWith(false);
  },
};
