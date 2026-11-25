import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Switch } from './Switch';

const change = fn();

function Enabled({ checked }: { checked: boolean }) {
  const [on, setOn] = useState(checked);

  return (
    <Switch
      label="Enabled"
      checked={on}
      onChange={(next) => {
        change(next);
        setOn(next);
      }}
    />
  );
}

const meta = {
  title: 'Design system/Switch',
  component: Enabled,
  parameters: { layout: 'padded' },
  args: { checked: true },
  beforeEach: () => {
    change.mockClear();
  },
} satisfies Meta<typeof Enabled>;

export default meta;

type Story = StoryObj<typeof meta>;

export const On: Story = {
  play: async ({ canvasElement }) => {
    const control = within(canvasElement).getByRole('switch', { name: 'Enabled' });

    await expect(control).toHaveClass('switch');
    await expect(control).toBeVisible();
    await expect(control).toBeChecked();
    await expect(control.closest('label')).toHaveClass('switch-field');
    await expect(within(canvasElement).getByText('On')).toBeVisible();
    await userEvent.click(control);
    await expect(change).toHaveBeenCalledWith(false);
    await expect(control).not.toBeChecked();
    await expect(within(canvasElement).getByText('Off')).toBeVisible();
  },
};

export const Off: Story = {
  args: { checked: false },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(page.getByRole('switch', { name: 'Enabled' })).not.toBeChecked();
    await userEvent.click(page.getByText('Off'));
    await expect(change).toHaveBeenCalledWith(true);
  },
};

export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    const control = within(canvasElement).getByRole('switch', { name: 'Enabled' });

    await userEvent.tab();
    await expect(control).toHaveFocus();
    await expect(control).toHaveStyle({ outlineStyle: 'solid' });
    await userEvent.keyboard(' ');
    await expect(change).toHaveBeenCalledWith(false);
    await expect(control).toHaveFocus();
  },
};
