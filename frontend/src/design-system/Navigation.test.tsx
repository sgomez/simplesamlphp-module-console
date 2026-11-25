import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { Segmented } from './Segmented';

describe('Segmented', () => {
  it('renders links with counts, the current one on', () => {
    render(
      <MemoryRouter>
        <Segmented
          label="Filter"
          current="all"
          segments={[
            { key: 'all', label: 'All', count: 42, to: '/?f=all' },
            { key: 'off', label: 'Not live', to: '/?f=off' },
          ]}
        />
      </MemoryRouter>,
    );

    const all = screen.getByRole('link', { name: /^All/ });
    expect(screen.getByRole('navigation', { name: 'Filter' }).className).toBe('seg');
    expect(all.className).toBe('on');
    expect(all.getAttribute('aria-current')).toBe('true');
    expect(screen.getByText('42').className).toBe('faint seg-count');
    expect(screen.getByRole('link', { name: 'Not live' }).hasAttribute('class')).toBe(false);
  });

  it('renders buttons that select a segment', () => {
    const onSelect = vi.fn();
    render(
      <Segmented
        label="View"
        current="form"
        segments={[
          { key: 'form', label: 'Settings', onSelect },
          { key: 'php', label: 'PHP', onSelect },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'PHP' }));

    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Settings' }).getAttribute('aria-pressed')).toBe('true');
  });
});
