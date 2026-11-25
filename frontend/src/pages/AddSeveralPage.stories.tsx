import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, userEvent, within } from 'storybook/test';
import { heldSeveral, SP_SEVERAL } from '../app/test/pasted';
import { StoryScreens } from '../app/test/StoryScreens';

const meta = {
  title: 'Pages/Add several',
  component: StoryScreens,
  parameters: { route: SP_SEVERAL },
  args: { held: heldSeveral },
} satisfies Meta<typeof StoryScreens>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AddSeveral: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByRole('heading', { name: 'Add service providers' })).toBeVisible();
    await expect(page.getByText('PHP array · 4 entities')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Select HR self-service' })).toBeDisabled();
    await expect(page.getByRole('checkbox', { name: 'Select Timetable' })).toBeChecked();
    await expect(page.getByText('Becomes an Override')).toBeVisible();
    await expect(page.getByText('2 selected')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create 2' })).toBeEnabled();
  },
};

export const Created: Story = {
  name: 'Draft: Created',
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    fireEvent.click(await page.findByRole('button', { name: 'Create 2' }));

    await expect(await page.findByText('2 created')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Timetable' })).toHaveAttribute(
      'href',
      '/entities/saml20-sp-remote/edit?entityid=https%3A%2F%2Ftimetable.example.edu%2Fsp',
    );
    await expect(await page.findByRole('heading', { name: 'Service providers' })).toBeVisible();
  },
};

export const OnePicked: Story = {
  name: 'Draft: One picked',
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await userEvent.click(await page.findByRole('checkbox', { name: 'Select Timetable' }));

    await expect(page.getByText('1 selected')).toBeVisible();
    fireEvent.click(page.getByRole('button', { name: 'Review' }));
    await expect(await page.findByRole('heading', { level: 1, name: 'Parking permits' })).toBeVisible();
  },
};

export const NothingPicked: Story = {
  name: 'Draft: Nothing picked',
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await userEvent.click(await page.findByRole('checkbox', { name: 'Select Timetable' }));
    await userEvent.click(page.getByRole('checkbox', { name: 'Select Parking permits' }));

    await expect(page.queryByText(/selected$/)).toBeNull();
    await expect(page.getByRole('button', { name: 'Create 0' })).toBeDisabled();
  },
};
