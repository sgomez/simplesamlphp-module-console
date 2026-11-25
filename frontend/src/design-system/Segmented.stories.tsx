import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { LinkSegmented, Segmented } from './Segmented';

const select = fn();

function Views() {
  const [current, setCurrent] = useState('form');
  const segment = (key: string, label: string) => ({
    key,
    label,
    onSelect: () => {
      select(key);
      setCurrent(key);
    },
  });

  return <Segmented label="View" current={current} segments={[segment('form', 'Settings'), segment('php', 'PHP')]} />;
}

const meta = {
  title: 'Design system/Segmented',
  component: Views,
  parameters: { layout: 'padded' },
  beforeEach: () => {
    select.mockClear();
  },
} satisfies Meta<typeof Views>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Buttons: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    const group = page.getByRole('radiogroup', { name: 'View' });
    const settings = page.getByRole('radio', { name: 'Settings' });
    const php = page.getByRole('radio', { name: 'PHP' });

    await expect(group).toHaveClass('seg');
    await expect(settings).toHaveAttribute('aria-checked', 'true');
    await expect(settings).toHaveAttribute('data-selected', 'true');
    await expect(php).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(php);
    await expect(select).toHaveBeenLastCalledWith('php');
    await expect(php).toHaveAttribute('data-selected', 'true');
    await expect(settings).not.toHaveAttribute('data-selected');
  },
};

export const Hover: Story = {
  play: async ({ canvasElement }) => {
    const php = within(canvasElement).getByRole('radio', { name: 'PHP' });

    // The real pointer's first move into the frame ends a synthetic hover, so hover until it holds.
    await waitFor(async () => {
      await userEvent.unhover(php);
      await userEvent.hover(php);
      await expect(php).toHaveAttribute('data-hovered', 'true');
    });
  },
};

export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    const [settings, php] = within(canvasElement).getAllByRole('radio');

    await userEvent.tab();
    await expect(settings).toHaveFocus();
    await expect(settings).toHaveAttribute('data-focus-visible', 'true');
    await userEvent.keyboard('{ArrowRight}');
    await expect(php).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(select).toHaveBeenLastCalledWith('php');
    await expect(php).toHaveAttribute('aria-checked', 'true');
    await userEvent.keyboard('{ArrowLeft}{Enter}');
    await expect(settings).toHaveAttribute('aria-checked', 'true');
    await userEvent.keyboard('{Enter}');
    await expect(settings).toHaveAttribute('aria-checked', 'true');
    await expect(select).toHaveBeenCalledTimes(2);
  },
};

export const Links: Story = {
  render: () => (
    <LinkSegmented
      label="Filter"
      current="all"
      segments={[
        { key: 'all', label: 'All', count: 42, to: '/?f=all' },
        { key: 'not-live', label: 'Not live', count: 3, to: '/?f=not-live' },
        { key: 'warnings', label: 'With warnings', to: '/?f=warnings' },
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    const all = page.getByRole('link', { name: /^All/ });
    const notLive = page.getByRole('link', { name: /^Not live/ });

    await expect(page.getByRole('navigation', { name: 'Filter' })).toHaveClass('seg');
    await expect(all).toHaveAttribute('data-current', 'true');
    await expect(all).toHaveAttribute('aria-current', 'true');
    await expect(notLive).not.toHaveAttribute('aria-current');
    await expect(notLive).toHaveAttribute('href', '/?f=not-live');
    await expect(page.getByText('42')).toHaveClass('faint seg-count');
    await userEvent.tab();
    await expect(all).toHaveFocus();
    await userEvent.tab();
    await expect(notLive).toHaveFocus();
  },
};
