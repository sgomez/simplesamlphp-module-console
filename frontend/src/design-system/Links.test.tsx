import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Facts } from './Facts';

describe('Facts', () => {
  it('lists terms and values, a strong value in bold', () => {
    const { container } = render(<Facts facts={[{ term: 'Becomes', value: 'Snapshot #42', className: 'is-strong' }, { term: 'Nodes', value: '3' }]} />);

    expect(container.innerHTML).toBe(
      '<dl class="facts"><dt class="muted">Becomes</dt><dd class="is-strong">Snapshot #42</dd>' +
        '<dt class="muted">Nodes</dt><dd>3</dd></dl>',
    );
  });
});
