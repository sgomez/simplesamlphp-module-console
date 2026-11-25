import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Facts } from './Facts';

const meta = {
  title: 'Design system/Facts',
  component: Facts,
  parameters: { layout: 'padded' },
  args: {
    facts: [
      { term: 'Subject', value: 'CN=moodle.example.edu', className: 'mono' },
      { term: 'Expires', value: '14 Mar 2029' },
      { term: 'SHA-256', value: '3F:9A:27:C1 … 71:AC:0E:66', className: 'mono' },
    ],
  },
} satisfies Meta<typeof Facts>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Certificate: Story = {
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector('dl') as HTMLElement;

    await expect(list).toHaveClass('facts', { exact: true });
    await expect([...list.querySelectorAll('dt')].map((term) => [term.className, term.textContent])).toEqual([
      ['muted', 'Subject'],
      ['muted', 'Expires'],
      ['muted', 'SHA-256'],
    ]);
    await expect([...list.querySelectorAll('dd')].map((value) => value.className)).toEqual(['mono', '', 'mono']);
  },
};

export const Strong: Story = {
  args: { facts: [{ term: 'Becomes', value: 'Snapshot #42', className: 'is-strong' }] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Snapshot #42')).toHaveClass('is-strong');
  },
};
