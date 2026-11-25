import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Diff } from './Diff';

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
