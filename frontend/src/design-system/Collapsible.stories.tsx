import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { AddButton } from './AddButton';
import { Collapsible } from './Collapsible';
import { PageIndex } from './PageIndex';

function Folding({ errors, onAdd }: { errors: number; onAdd: () => void }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <>
      <PageIndex title="On this page" label="Sections" entries={[{ target: 'g-0', label: 'Basics', count: '2 of 5', ...(errors > 0 && { note: '1 error' }) }]} />
      <Collapsible id="g-0" title="Basics" meta="2 of 5 set" errors={errors} expanded={expanded} onExpandedChange={setExpanded}>
        <div className="opt-adds">
          <AddButton title="Identity provider" onPress={onAdd}>
            idp
          </AddButton>
        </div>
      </Collapsible>
    </>
  );
}

const meta = {
  title: 'Design system/Collapsible',
  component: Folding,
  parameters: { layout: 'padded' },
  args: { errors: 1, onAdd: fn() },
} satisfies Meta<typeof Folding>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const page = within(canvasElement);
    const trigger = page.getByRole('button', { name: /^Basics/ });

    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(within(trigger).getByText('1 error')).toBeVisible();
    await expect(page.getByRole('link', { name: /Basics/ })).toHaveAttribute('href', '#g-0');
    await userEvent.click(page.getByRole('button', { name: 'Add idp' }));
    await expect(args.onAdd).toHaveBeenCalled();
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.keyboard('{Enter}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  },
};

export const NoErrors: Story = {
  args: { errors: 0 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByText(/error/)).toBeNull();
  },
};
