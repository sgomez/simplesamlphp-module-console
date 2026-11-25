import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Eid } from './Eid';
import { Code, Pre } from './Code';
import { Disclosure } from './Disclosure';
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

  it('wraps whole on its own page', () => {
    render(<Eid wrap id="https://hr.example.edu/sp" />);

    expect(screen.getByText('https://hr.example.edu/sp').className).toBe('mono wrap-any');
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

  it('heads a state page, its content between the text and the actions', () => {
    const { container } = render(
      <Empty state title="Down" text="Why." actions={<a href="/">Back</a>}>
        <dl className="facts" />
      </Empty>,
    );

    expect(container.firstElementChild?.className).toBe('card empty state-card');
    expect(screen.getByRole('heading', { level: 1, name: 'Down' }).className).toBe('h1');
    expect([...(container.firstElementChild?.children ?? [])].map((el) => el.className)).toEqual([
      'h1',
      'muted empty-text',
      'facts',
      'empty-actions',
    ]);
  });

  it('drops the offset of a state page that sits under a callout', () => {
    const { container } = render(<Empty state flush title="Down" />);

    expect(container.firstElementChild?.className).toBe('card empty');
  });
});

describe('Disclosure', () => {
  it('folds its content under a small summary', () => {
    const { container } = render(
      <Disclosure summary="Technical detail">
        <p>inside</p>
      </Disclosure>,
    );

    const details = container.firstElementChild as HTMLDetailsElement;
    expect(details.tagName).toBe('DETAILS');
    expect(details.className).toBe('grp');
    expect(details.open).toBe(false);
    expect(details.querySelector('summary > span.small')?.textContent).toBe('Technical detail');
    expect(details.querySelector('p')?.textContent).toBe('inside');
  });

  it('folds a card under a bold summary, its content indented', () => {
    const { container } = render(
      <Disclosure card summary="2 warnings">
        <p>inside</p>
      </Disclosure>,
    );

    const details = container.firstElementChild as HTMLDetailsElement;
    expect(details.className).toBe('grp card');
    expect(details.querySelector('summary > span.row-name')?.textContent).toBe('2 warnings');
    expect(details.querySelector('.grp-body > p')?.textContent).toBe('inside');
  });
});

describe('Pre', () => {
  it('holds text that scrolls, reachable from the keyboard and named', () => {
    render(<Pre label="Technical detail">SQLSTATE[HY000]</Pre>);

    const pre = screen.getByLabelText('Technical detail');
    expect(pre.tagName).toBe('PRE');
    expect(pre.className).toBe('code');
    expect(pre.tabIndex).toBe(0);
    expect(pre.textContent).toBe('SQLSTATE[HY000]');
  });

  it('heads a block with its label and an action', () => {
    const { container } = render(
      <Code label="PHP" action={<b>Copy</b>}>
        x
      </Code>,
    );

    expect(container.firstElementChild?.className).toBe('code-block');
    expect([...(container.querySelector('.code-head')?.children ?? [])].map((el) => el.textContent)).toEqual(['PHP', 'Copy']);
    expect(screen.getByLabelText('PHP').textContent).toBe('x');
  });
});

describe('Skeleton', () => {
  it('renders two busy rows of bars', () => {
    render(<Skeleton />);

    const busy = screen.getByRole('status', { name: 'Loading' });
    expect(busy.getAttribute('aria-busy')).toBe('true');
    expect([...busy.querySelectorAll('.skel')].map((bar) => bar.className)).toEqual([
      'skel skel-34',
      'skel skel-62',
      'skel skel-26',
      'skel skel-54',
    ]);
  });
});
