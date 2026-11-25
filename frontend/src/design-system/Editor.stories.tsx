import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from './Button';
import { Editor, type EditorHandle } from './Editor';

const PHP = "<?php\n$metadata['https://sp.example.edu'] = [\n    'AssertionConsumerService' => 'disco',\n];";

const meta = {
  title: 'Design system/Editor',
  component: Editor,
  parameters: { layout: 'padded' },
  args: { label: 'PHP', value: PHP, onChange: fn() },
} satisfies Meta<typeof Editor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const text = within(canvasElement).getByRole('textbox', { name: 'PHP' });
    const gutter = [...canvasElement.querySelectorAll('.ed-ln')];

    await expect(text).toHaveClass('ed-text');
    await expect(text).toHaveAttribute('rows', '4');
    await expect(text).toHaveAttribute('spellcheck', 'false');
    await expect(gutter.map((line) => line.textContent)).toEqual(['1', '2', '3', '4']);
    await userEvent.tab();
    await expect(text).toHaveFocus();
    await expect(text).toHaveAttribute('data-focus-visible', 'true');
    await userEvent.keyboard('{End}x');
    await expect(args.onChange).toHaveBeenLastCalledWith(`${PHP}x`);
  },
};

export const Marks: Story = {
  args: { marks: { 3: 'err', 2: 'warn' } },
  play: async ({ canvasElement }) => {
    const gutter = [...canvasElement.querySelectorAll('.ed-ln')];

    await expect(gutter.map((line) => line.className)).toEqual(['ed-ln', 'ed-ln warn', 'ed-ln err', 'ed-ln']);
    await expect(gutter.map((line) => line.textContent)).toEqual(['1', '!2', '×3', '4']);
    await expect([...canvasElement.querySelectorAll('.ed-bg div')].map((line) => line.className)).toEqual(['', 'warn', 'err', '']);
  },
};

export const Busy: Story = {
  args: { busy: true },
  play: async ({ canvasElement, args }) => {
    const text = within(canvasElement).getByRole('textbox', { name: 'PHP' });

    await expect(text).toHaveAttribute('readonly');
    await expect(text).toHaveAttribute('aria-busy', 'true');
    await userEvent.type(text, 'x');
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

function WithGoTo() {
  const editor = useRef<EditorHandle>(null);

  return (
    <>
      <Button onPress={() => editor.current?.goToLine(3)}>Go to line 3</Button>
      <Editor ref={editor} label="PHP" value={PHP} marks={{ 3: 'err' }} onChange={fn()} />
    </>
  );
}

export const GoToLine: Story = {
  render: () => <WithGoTo />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    const text = page.getByRole('textbox', { name: 'PHP' }) as HTMLTextAreaElement;

    await userEvent.click(page.getByRole('button', { name: 'Go to line 3' }));
    await expect(text).toHaveFocus();
    await expect(text.selectionStart).toBe(PHP.indexOf("    'Assertion"));
  },
};
