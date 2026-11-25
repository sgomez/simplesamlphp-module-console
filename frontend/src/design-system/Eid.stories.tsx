import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Eid } from './Eid';

const ID = 'https://intranet-old.example.edu/simplesaml/module.php/saml/sp/metadata.php/default-sp';

// The board's specimens at 420 and 260 px, plus the padded layout's 16 px on each side.
const viewport = {
  options: {
    eid420: { name: '420 px', styles: { width: '452px', height: '240px' } },
    eid260: { name: '260 px', styles: { width: '292px', height: '240px' } },
  },
};

const meta = {
  title: 'Design system/Eid',
  component: Eid,
  parameters: { layout: 'padded', viewport },
  args: { id: ID },
} satisfies Meta<typeof Eid>;

export default meta;

type Story = StoryObj<typeof meta>;

function parts(canvasElement: HTMLElement) {
  const eid = within(canvasElement).getByTitle(ID);

  return { eid, head: eid.querySelector('.eid-a') as HTMLElement, tail: eid.querySelector('.eid-b') as HTMLElement };
}

export const Whole: Story = {
  play: async ({ canvasElement }) => {
    const { eid, head, tail } = parts(canvasElement);

    await expect(eid.textContent).toBe(ID);
    await expect(tail.textContent).toBe('a.php/default-sp');
    await expect(head.scrollWidth).toBe(head.clientWidth);
  },
};

const cut: Story['play'] = async ({ canvasElement }) => {
  const { eid, head, tail } = parts(canvasElement);

  await expect(eid.textContent).toBe(ID);
  await expect(head.scrollWidth).toBeGreaterThan(head.clientWidth);
  await expect(getComputedStyle(head).textOverflow).toBe('ellipsis');
  await expect(tail.scrollWidth).toBe(tail.clientWidth);
};

export const MiddleEllipsis420: Story = {
  name: 'Middle ellipsis at 420 px',
  globals: { viewport: { value: 'eid420' } },
  play: cut,
};

export const MiddleEllipsis260: Story = {
  name: 'Middle ellipsis at 260 px',
  globals: { viewport: { value: 'eid260' } },
  play: cut,
};

export const Wrapped: Story = {
  name: 'Wrapped, on its own page',
  args: { wrap: true },
  globals: { viewport: { value: 'eid260' } },
  play: async ({ canvasElement }) => {
    const id = within(canvasElement).getByText(ID);

    await expect(id).toHaveClass('mono wrap-any', { exact: true });
    await expect(id.getClientRects().length).toBeGreaterThan(1);
  },
};
