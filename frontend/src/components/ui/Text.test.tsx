import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Code, Token } from './Code';
import { Diff } from './Diff';
import { Editor } from './Editor';

describe('Code', () => {
  it('shows the text and copies it', () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    render(<Code label="PHP" text="'a' => true," />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(screen.getByText("'a' => true,").className).toBe('code');
    expect(screen.getByText('PHP').className).toBe('xs muted code-label');
    expect(writeText).toHaveBeenCalledWith("'a' => true,");
  });

  it('renders highlighted tokens', () => {
    render(
      <Code label="PHP" text="'a' => true,">
        <Token kind="s">{"'a'"}</Token> =&gt; <Token kind="k">true</Token>,
      </Code>,
    );

    expect(screen.getByText("'a'").className).toBe('tk-s');
    expect(screen.getByText('true').className).toBe('tk-k');
  });
});

describe('Diff', () => {
  it('marks each line with its sign', () => {
    const { container } = render(
      <Diff
        lines={[
          { kind: 'same', text: 'a' },
          { kind: 'del', text: 'b' },
          { kind: 'add', text: 'c' },
          { kind: 'sec', text: 'secret changed' },
        ]}
      />,
    );

    const lines = [...container.querySelectorAll('.dl')];
    expect(container.firstElementChild?.className).toBe('diff');
    expect(lines.map((line) => line.className)).toEqual(['dl', 'dl dl-del', 'dl dl-add', 'dl dl-sec']);
    expect(lines.map((line) => line.querySelector('.ds')?.textContent)).toEqual(['', '-', '+', '~']);
  });
});

describe('Editor', () => {
  it('numbers the lines and marks errors and warnings in the gutter and behind the text', () => {
    const { container } = render(<Editor label="PHP" value={'a\nb\nc'} marks={{ 2: 'err', 3: 'warn' }} onChange={vi.fn()} />);

    const gutter = [...container.querySelectorAll('.ed-ln')];
    expect(gutter.map((line) => line.className)).toEqual(['ed-ln', 'ed-ln err', 'ed-ln warn']);
    expect(gutter.map((line) => line.textContent)).toEqual(['1', '×2', '!3']);
    expect([...container.querySelectorAll('.ed-bg div')].map((line) => line.className)).toEqual(['', 'err', 'warn']);
  });

  it('edits the text', () => {
    const onChange = vi.fn();
    render(<Editor label="PHP" value="a" onChange={onChange} />);
    const text = screen.getByRole('textbox', { name: 'PHP' });

    fireEvent.change(text, { target: { value: 'a\nb' } });

    expect(text.className).toBe('ed-text');
    expect(text.getAttribute('rows')).toBe('1');
    expect(onChange).toHaveBeenCalledWith('a\nb');
  });
});
