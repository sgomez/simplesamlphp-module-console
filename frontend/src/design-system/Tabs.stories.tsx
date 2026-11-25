import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { useLocation } from 'react-router';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { LinkTabs, Tabs, type PanelTab } from './Tabs';

const meta = {
  title: 'Design system/Tabs',
  component: LinkTabs,
  parameters: { layout: 'padded', route: '/history' },
  args: {
    label: 'Views',
    current: 'snapshots',
    tabs: [
      { key: 'snapshots', label: 'Snapshots', to: '/history' },
      { key: 'audit', label: 'Audit trail', to: '/history/audit' },
    ],
  },
} satisfies Meta<typeof LinkTabs>;

export default meta;

type Story = StoryObj<typeof meta>;

function Where() {
  return <output aria-label="Location">{useLocation().pathname}</output>;
}

export const Links: Story = {
  render: (args) => (
    <>
      <LinkTabs {...args} />
      <Where />
    </>
  ),
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    const snapshots = page.getByRole('link', { name: 'Snapshots' });
    const audit = page.getByRole('link', { name: 'Audit trail' });

    await expect(page.getByRole('navigation', { name: 'Views' })).toHaveClass('tabs');
    await expect(snapshots).toHaveAttribute('aria-current', 'page');
    await expect(snapshots).toHaveAttribute('data-current', 'true');
    await expect(audit).not.toHaveAttribute('aria-current');
    await expect(audit).toHaveAttribute('href', '/history/audit');

    await userEvent.tab();
    await expect(snapshots).toHaveFocus();
    await userEvent.tab();
    await expect(audit).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(page.getByLabelText('Location')).toHaveTextContent('/history/audit'));
  },
};

const panels: PanelTab[] = [
  { key: 'php', label: 'PHP', panel: <p>$metadata</p> },
  { key: 'settings', label: 'Settings', panel: <p>Signing</p> },
  { key: 'raw', label: 'Raw', panel: <p>Bytes</p> },
];

function Panels({ onSelect }: { onSelect: (key: string) => void }) {
  const [selected, setSelected] = useState('php');

  return (
    <Tabs
      label="View"
      tabs={panels}
      selected={selected}
      onSelect={(key) => {
        onSelect(key);
        setSelected(key);
      }}
    />
  );
}

export const Draft: StoryObj<{ onSelect: (key: string) => void }> = {
  name: 'Draft: Panels',
  args: { onSelect: fn() },
  render: ({ onSelect }) => <Panels onSelect={onSelect} />,
  play: async ({ canvasElement, args }) => {
    const page = within(canvasElement);
    const list = page.getByRole('tablist', { name: 'View' });
    const [php, settings, raw] = page.getAllByRole('tab');

    await expect(list).toHaveClass('tabs');
    await expect(php).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toHaveTextContent('$metadata');

    await userEvent.tab();
    await expect(php).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(settings).toHaveFocus();
    await expect(settings).toHaveAttribute('aria-selected', 'true');
    await expect(args.onSelect).toHaveBeenCalledWith('settings');
    await expect(page.getByRole('tabpanel')).toHaveTextContent('Signing');
    await userEvent.keyboard('{ArrowRight}');
    await expect(raw).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(php).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(raw).toHaveFocus();

    await userEvent.tab();
    await expect(page.getByRole('tabpanel')).toHaveFocus();
    await expect(page.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', raw?.id);
  },
};
