import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from './Button';
import { Code } from './Code';

const php = (
  <>
    <span className="tk-s">&apos;entityid&apos;</span> =&gt; <span className="tk-s">&apos;https://hr.example.edu/sp&apos;</span>,{'\n'}
    <span className="tk-s">&apos;validate.authnrequest&apos;</span> =&gt; <span className="tk-k">true</span>,{' '}
    <span className="tk-c">{'// set in the Console'}</span>
  </>
);

const meta = {
  title: 'Design system/Code',
  component: Code,
  parameters: { layout: 'padded' },
  args: { label: 'PHP', children: php },
} satisfies Meta<typeof Code>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithAction: Story = {
  name: 'With an action',
  args: {
    action: (
      <Button variant="quiet" small onPress={fn()}>
        Copy
      </Button>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pre = canvas.getByLabelText('PHP', { selector: 'pre' });

    await expect(canvas.getByText('PHP', { selector: '.code-label' })).toHaveClass('xs muted code-label');
    await expect(canvas.getByRole('button', { name: 'Copy' })).toHaveClass('btn btn-quiet btn-sm');
    await expect(pre).toHaveClass('code');
    await expect(pre.textContent).toBe("'entityid' => 'https://hr.example.edu/sp',\n'validate.authnrequest' => true, // set in the Console");
    await expect([...pre.querySelectorAll('span')].map((token) => token.className)).toEqual(['tk-s', 'tk-s', 'tk-s', 'tk-k', 'tk-c']);
  },
};

export const Plain: Story = {
  args: { label: 'Technical detail', children: 'SQLSTATE[HY000] [2002] Connection refused' },
  play: async ({ canvasElement }) => {
    const pre = within(canvasElement).getByLabelText('Technical detail', { selector: 'pre' });

    await userEvent.tab();
    await expect(pre).toHaveFocus();
    await expect(canvasElement.querySelector('button')).toBeNull();
  },
};
