import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { SearchPick, type Pick } from './SearchPick';

const ALL: Pick[] = [
  { id: 'sign.logout', label: 'Sign logout messages', detail: 'sign.logout · Signing' },
  { id: 'metadata.sign.algorithm', label: 'Metadata signature algorithm', detail: 'metadata.sign.algorithm', disabled: 'Applies only when metadata.sign.enable is true.' },
];

function Finding({ onPick }: { onPick: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const items = ALL.filter((item) => item.id.includes(query.toLowerCase()));

  return <SearchPick label="Find an option" placeholder="Find an option" items={items} query={query} onQuery={setQuery} onPick={onPick} shortcut="/" />;
}

const meta = {
  title: 'Design system/Search pick',
  component: Finding,
  parameters: { layout: 'padded' },
  args: { onPick: fn() },
} satisfies Meta<typeof Finding>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const page = within(canvasElement.ownerDocument.body);
    const field = within(canvasElement).getByRole('combobox', { name: 'Find an option' });

    await userEvent.keyboard('/');
    await expect(field).toHaveFocus();
    await userEvent.keyboard('sign');
    await expect(await page.findByRole('option', { name: /Metadata signature algorithm/ })).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(page.getByRole('option', { name: /Sign logout messages/ }));
    await expect(args.onPick).toHaveBeenCalledWith('sign.logout');
    await expect(field).toHaveValue('');
  },
};

export const NoMatch: Story = {
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('combobox', { name: 'Find an option' });

    await userEvent.type(field, 'zzz');
    await expect(await within(canvasElement.ownerDocument.body).findByText('No option matches.')).toBeVisible();
    await userEvent.keyboard('{Escape}');
  },
};
