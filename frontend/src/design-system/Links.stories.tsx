import type { Meta, StoryObj } from '@storybook/react-vite';
import { useLocation } from 'react-router';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Card } from './Card';
import { Row } from './Row';
import { TextLink } from './TextLink';

function Where() {
  const { pathname, search } = useLocation();

  return <output aria-label="Location">{pathname + search}</output>;
}

const meta = {
  title: 'Design system/Links',
  component: TextLink,
  parameters: { layout: 'padded', route: '/publish' },
  args: { to: '/entities/saml20-sp?entityid=a', children: 'https://a.example.org' },
  render: (args) => (
    <>
      <p>
        <TextLink {...args} />
      </p>
      <Where />
    </>
  ),
} satisfies Meta<typeof TextLink>;

export default meta;

type Story = StoryObj<typeof meta>;

const location = (canvasElement: HTMLElement) => within(canvasElement).getByLabelText('Location');

export const Route: Story = {
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: 'https://a.example.org' });

    await expect(link).toHaveClass('link');
    await expect(link).toHaveAttribute('href', '/entities/saml20-sp?entityid=a');
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(location(canvasElement)).toHaveTextContent('/entities/saml20-sp?entityid=a'));
  },
};

export const Inherit: Story = {
  args: { inherit: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('link')).toHaveClass('link link-inherit');
  },
};

export const Address: Story = {
  render: () => (
    <TextLink href="#line-3" className="mono">
      Line 3
    </TextLink>
  ),
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: 'Line 3' });

    await expect(link).toHaveClass('link mono');
    await expect(link).toHaveAttribute('href', '#line-3');
    await expect(link).not.toHaveAttribute('data-rac');
  },
};

export const LinkedRow: Story = {
  name: 'Linked row',
  render: () => (
    <>
      <Card list>
        <Row to="/entities/saml20-sp?entityid=a" tight>
          <span className="row-name">https://a.example.org</span>
        </Row>
        <Row plain tight>
          <span className="row-name">https://b.example.org</span>
        </Row>
      </Card>
      <Where />
    </>
  ),
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    const row = page.getByRole('link', { name: 'https://a.example.org' });

    await expect(row).toHaveClass('row row-tight');
    await expect(page.getByText('https://b.example.org').parentElement).toHaveClass('row row-tight');
    await userEvent.click(row);
    await waitFor(() => expect(location(canvasElement)).toHaveTextContent('/entities/saml20-sp?entityid=a'));
  },
};
