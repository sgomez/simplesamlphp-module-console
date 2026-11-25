import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, userEvent, within } from 'storybook/test';
import { edited } from '../app/adapters/memory/edited';
import { hrSelfService } from '../app/adapters/memory/pastedBoards';
import { heldOne, SP_REVIEW } from '../app/test/pasted';
import { StoryScreens } from '../app/test/StoryScreens';

const meta = {
  title: 'Pages/Review pasted configuration',
  component: StoryScreens,
  parameters: { route: SP_REVIEW },
  args: { held: heldOne() },
} satisfies Meta<typeof StoryScreens>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AddReview: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByRole('heading', { level: 1, name: 'Travelbooker' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Understood' })).toBeVisible();
    await expect(page.getByText('Taken from OrganizationName')).toBeVisible();
    await expect(page.getByText('Managed entities do not expire')).toBeVisible();
    await expect(page.getByLabelText('PHP', { selector: 'pre' })).toHaveTextContent("'validate.authnrequest' => true");
    await expect(page.getByRole('button', { name: 'Edit first' })).toBeVisible();
  },
};

export const ReviewNeeds: Story = {
  args: { held: heldOne(hrSelfService) },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByRole('heading', { name: 'Needs you' })).toBeVisible();
    await expect(page.getByText('Secret in clear text. Use a Secret reference.')).toHaveClass('msg-warning');
    await expect(page.getByText('Was a function call. Paste the certificate.')).toHaveClass('msg-error');
    await expect(page.getByRole('heading', { name: 'Kept as extra' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue in editor' })).toBeVisible();
    await expect(page.queryByRole('button', { name: 'Save' })).toBeNull();
  },
};

export const EditFirst: Story = {
  name: 'Draft: Edit first',
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await userEvent.click(await page.findByRole('button', { name: 'Edit first' }));

    await expect(
      (
        (await page.findByRole('textbox', {
          name: 'PHP',
        })) as HTMLTextAreaElement
      ).value,
    ).toContain("'name' => ['en' => 'Travelbooker']");
    await userEvent.click(page.getByRole('button', { name: 'Cancel' }));
    await expect(await page.findByRole('button', { name: 'Edit first' })).toBeVisible();
  },
};

export const Saved: Story = {
  name: 'Draft: Saved',
  args: {
    sets: {
      'saml20-sp-remote': {
        save: (draft) => ({
          kind: 'saved',
          entity: edited({ php: draft.php }),
        }),
      },
    },
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    fireEvent.click(await page.findByRole('button', { name: 'Save' }));

    await expect(await page.findByText('Saved.')).toBeVisible();
    await expect(await page.findByRole('heading', { name: 'Service providers' })).toBeVisible();
  },
};

export const NotSaved: Story = {
  name: 'Draft: Not saved',
  args: {
    sets: {
      'saml20-sp-remote': {
        save: () => ({
          kind: 'invalid',
          refusal: {
            readable: true,
            notices: [],
            errors: [
              {
                pointer: '/AssertionConsumerService',
                message: 'At least one endpoint is required.',
                line: 3,
                column: null,
              },
            ],
          },
        }),
      },
    },
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    fireEvent.click(await page.findByRole('button', { name: 'Save' }));

    await expect(await page.findByText('Not saved')).toBeVisible();
    await expect(page.getByText('At least one endpoint is required.')).toBeVisible();
  },
};

export const NothingHeld: Story = {
  name: 'Draft: Reached without a reading',
  args: { held: null },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);

    await expect(await page.findByRole('heading', { name: 'Add service provider' })).toBeVisible();
  },
};
