import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import {
  ChevronDownIcon,
  ChevronIcon,
  CrossIcon,
  ErrorIcon,
  InfoIcon,
  LogoutIcon,
  MenuIcon,
  PlusIcon,
  SuccessIcon,
  WarningIcon,
} from './icons';

function Icons() {
  return (
    <div className="toolbar">
      <PlusIcon />
      <PlusIcon size={12} />
      <ChevronIcon />
      <ChevronDownIcon />
      <MenuIcon />
      <LogoutIcon />
      <CrossIcon />
      <WarningIcon className="ic ic-warning" />
      <ErrorIcon className="ic ic-error" />
      <InfoIcon className="ic ic-info" />
      <SuccessIcon className="ic ic-success" />
    </div>
  );
}

const meta = {
  title: 'Design system/Icons',
  component: Icons,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Icons>;

export default meta;

type Story = StoryObj<typeof meta>;

export const All: Story = {
  play: async ({ canvasElement }) => {
    const icons = [...canvasElement.querySelectorAll('svg')];

    await expect(icons).toHaveLength(11);
    await expect(icons.every((icon) => icon.getAttribute('aria-hidden') === 'true')).toBe(true);
    await expect(icons.map((icon) => icon.getBoundingClientRect().width)).toEqual([14, 12, 16, 12, 16, 16, 14, 16, 16, 16, 16]);
  },
};
