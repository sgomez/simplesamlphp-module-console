import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { boardRows, disabled, row, warning } from '../../app/adapters/memory/rows';
import { Card } from '../../design-system/Card';
import { EntityListRow } from './EntityListRow';
import type { EntityRow } from './types';

function Rows({ rows }: { rows: EntityRow[] }) {
  return (
    <Card list>
      {rows.map((entity) => (
        <EntityListRow key={entity.entityId} row={entity} />
      ))}
    </Card>
  );
}

const meta = {
  title: 'Domain/Entities/List row',
  component: Rows,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Rows>;

export default meta;

type Story = StoryObj<typeof meta>;

export const States: Story = {
  args: {
    rows: [
      ...boardRows.slice(2, 5),
      row('https://travel.example.com/sp', { name: 'Travel booking', state: 'Unpublished' }),
      row('https://archive.example.edu/sp', { name: 'Archive', state: null, labels: [disabled] }),
      row('https://broken.example.edu/sp', {
        name: 'Broken service',
        labels: [{ text: 'Errors', kind: 'error', title: '/AssertionConsumerService: Missing.' }, warning('Signing off', 'Responses are not signed.')],
      }),
      row('https://unnamed.example.edu/shibboleth'),
      row('https://bad.example.org/sp', { state: 'Unreadable', unreadable: true, error: 'The stored document is not valid JSON.' }),
    ],
  },
  play: async ({ canvasElement }) => {
    const card = within(canvasElement);

    await expect(card.getByText('Modified, not live')).toBeVisible();
    await expect(card.getByText('Disabled, not published')).toBeVisible();
    await expect(card.getByText('New, not published')).toBeVisible();
    await expect(card.getByText('Disabled')).toBeVisible();
    await expect(card.getByText('Errors')).toBeVisible();
    await expect(card.getAllByText('+1 more')).toHaveLength(2);
    await expect(card.getByRole('button', { name: 'Delete…' })).toBeVisible();
  },
};
