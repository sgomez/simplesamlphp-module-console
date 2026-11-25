import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button, LinkButton } from './Button';
import { MenuIcon, PlusIcon } from './icons';

const meta = {
  title: 'Design system/Button',
  component: Button,
  parameters: { layout: 'padded' },
  args: { children: 'Save', onPress: fn() },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Secondary: Story = {
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Save' });

    await expect(button).toHaveClass('btn btn-secondary');
    await expect(button).toHaveAttribute('type', 'button');
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    await userEvent.click(button);
    await expect(args.onPress).toHaveBeenCalledTimes(3);
  },
};

export const Variants: Story = {
  render: (args) => (
    <div className="empty-actions">
      <Button {...args} variant="primary">Primary</Button>
      <Button {...args} variant="secondary">Secondary</Button>
      <Button {...args} variant="quiet">Quiet</Button>
      <Button {...args} variant="danger">Danger</Button>
      <Button {...args} variant="danger-solid">Danger solid</Button>
      <Button {...args} variant="global">Global</Button>
      <Button {...args} small>Small</Button>
      <Button {...args} iconOnly small label="Add">
        <PlusIcon />
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(page.getByRole('button', { name: 'Danger solid' })).toHaveClass('btn btn-danger-solid');
    await expect(page.getByRole('button', { name: 'Small' })).toHaveClass('btn btn-secondary btn-sm');
    await expect(page.getByRole('button', { name: 'Add' })).toHaveClass('btn btn-secondary btn-sm btn-icon');
  },
};

export const Disabled: Story = {
  args: { disabled: true, type: 'submit' },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Save' });

    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute('type', 'submit');
    await userEvent.click(button);
    await expect(args.onPress).not.toHaveBeenCalled();
  },
};

export const Pending: Story = {
  args: { variant: 'primary', loading: true, children: 'Publishing' },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Publishing' });

    await expect(button).toHaveAttribute('data-pending', 'true');
    await userEvent.click(button);
    await expect(args.onPress).not.toHaveBeenCalled();
  },
};

export const Disclosure: Story = {
  args: { menu: true, iconOnly: true, label: 'Menu', controls: 'nav', expanded: false, children: <MenuIcon /> },
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector('button');

    await expect(button).toHaveAttribute('aria-label', 'Menu');
    await expect(button).toHaveClass('btn btn-secondary btn-icon menu-btn');
    await expect(button).toHaveAttribute('aria-controls', 'nav');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  },
  render: (args) => (
    <>
      <Button {...args} />
      <nav id="nav" aria-label="Main" />
    </>
  ),
};

export const Links: Story = {
  render: () => (
    <div className="empty-actions">
      <LinkButton to="/entities" variant="primary">
        Next
      </LinkButton>
      <LinkButton href="/publish">Review</LinkButton>
      <LinkButton to="/x" disabled small>
        Previous
      </LinkButton>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(page.getByRole('link', { name: 'Next' })).toHaveAttribute('href', '/entities');
    await expect(page.getByRole('link', { name: 'Review' })).toHaveClass('btn btn-secondary');
    const previous = page.getByText('Previous');
    await expect(previous).toHaveAttribute('aria-disabled', 'true');
    await expect(previous).not.toHaveAttribute('href');
  },
};
