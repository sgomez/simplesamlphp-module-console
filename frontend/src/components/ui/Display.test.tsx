import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Eid } from './Eid';
import { Empty } from './Empty';
import { Skeleton } from './Skeleton';

describe('Eid', () => {
  it('splits off the last 16 characters and keeps the full value on hover', () => {
    render(<Eid id="https://hr.example.edu/sp" />);

    const eid = screen.getByTitle('https://hr.example.edu/sp');
    expect(eid.querySelector('.eid-a')?.textContent).toBe('https://h');
    expect(eid.querySelector('.eid-b')?.textContent).toBe('r.example.edu/sp');
  });

  it('keeps a short ID whole in the tail', () => {
    render(<Eid id="my-sp" />);

    expect(screen.getByTitle('my-sp').querySelector('.eid-b')?.textContent).toBe('my-sp');
  });
});

describe('Empty', () => {
  it('says what is missing and offers the next step', () => {
    const { container } = render(<Empty title="Nothing is managed yet" text="Add one." actions={<a href="/new">Add</a>} />);

    expect(container.firstElementChild?.className).toBe('card empty');
    expect(screen.getByRole('heading', { name: 'Nothing is managed yet' }).className).toBe('h2');
    expect(screen.getByText('Add one.').className).toBe('muted empty-text');
    expect(container.querySelector('.empty-actions')?.textContent).toBe('Add');
  });

  it('renders the title alone', () => {
    const { container } = render(<Empty title="None" />);

    expect(container.querySelector('p, .empty-actions')).toBeNull();
  });
});

describe('Skeleton', () => {
  it('renders two busy rows of bars', () => {
    render(<Skeleton />);

    const busy = screen.getByLabelText('Loading');
    expect(busy.getAttribute('aria-busy')).toBe('true');
    expect([...busy.querySelectorAll('.skel')].map((bar) => bar.className)).toEqual([
      'skel skel-34',
      'skel skel-62',
      'skel skel-26',
      'skel skel-54',
    ]);
  });
});
