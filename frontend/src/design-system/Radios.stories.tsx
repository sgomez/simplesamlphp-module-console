import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Radios } from './Radios';

const change = fn();

function Format({ labelHidden = false }: { labelHidden?: boolean }) {
  const [value, setValue] = useState('persistent');

  return (
    <Radios
      label="Name ID format"
      labelHidden={labelHidden}
      value={value}
      options={[
        { value: 'persistent', label: 'Persistent' },
        { value: 'transient', label: 'Transient' },
      ]}
      onChange={(next) => {
        change(next);
        setValue(next);
      }}
    />
  );
}

const meta = {
  title: 'Design system/Radios',
  component: Format,
  parameters: { layout: 'padded' },
  beforeEach: () => {
    change.mockClear();
  },
} satisfies Meta<typeof Format>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    const group = page.getByRole('radiogroup', { name: 'Name ID format' });
    const persistent = page.getByRole('radio', { name: 'Persistent' });
    const transient = page.getByRole('radio', { name: 'Transient' });

    await expect(group).toHaveClass('field');
    await expect(page.getByText('Name ID format')).toHaveClass('label');
    await expect(persistent).toHaveClass('check');
    await expect(persistent).toBeChecked();
    await expect(persistent.closest('label')).toHaveClass('check-field');
    await userEvent.click(page.getByText('Transient'));
    await expect(change).toHaveBeenCalledWith('transient');
    await expect(transient).toBeChecked();
  },
};

export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    const [persistent, transient] = within(canvasElement).getAllByRole('radio');

    await userEvent.tab();
    await expect(persistent).toHaveFocus();
    await expect(persistent).toHaveStyle({ outlineStyle: 'solid' });
    await userEvent.keyboard('{ArrowDown}');
    await expect(transient).toHaveFocus();
    await expect(transient).toBeChecked();
    await expect(change).toHaveBeenCalledWith('transient');
  },
};

export const LabelHidden: Story = {
  args: { labelHidden: true },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(page.getByRole('radiogroup', { name: 'Name ID format' })).toBeVisible();
    await expect(page.getByText('Name ID format')).toHaveClass('sr-only');
  },
};
