import { within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { sp } from '../app/test/api';
import { rowOf } from '../app/test/list';

const warning = { text: 'Signing off', kind: 'warning', title: 'Responses are not signed.' } as const;

describe('a row of the list', () => {
  it('shows nothing for a published object without warnings', async () => {
    const row = await rowOf(sp('https://a.example.org'));

    expect(row.querySelector('.row-note')).toBeNull();
  });

  it('shows the state of the publish cycle as a dot and a word', async () => {
    const modified = await rowOf(sp('https://a.example.org', { state: 'Modified' }));

    expect(modified.querySelector('.status')?.className).toBe('status s-pending');
    expect(modified.querySelector('.dot')?.className).toBe('dot dot-half');
    expect(modified.querySelector('.status')?.textContent).toBe('Modified, not live');
  });

  it('shows an Unpublished object as new, with an empty dot', async () => {
    const row = await rowOf(sp('https://a.example.org', { state: 'Unpublished' }));

    expect(row.querySelector('.dot')?.className).toBe('dot');
    expect(row.querySelector('.status')?.textContent).toBe('New, not published');
  });

  it('shows a warning with its icon and message when nothing else is going on', async () => {
    const row = await rowOf(sp('https://a.example.org', { labels: [warning] }));
    const status = row.querySelector('.status') as HTMLElement;

    expect(status.className).toBe('status s-warn');
    expect(status.getAttribute('title')).toBe('Responses are not signed.');
    expect(status.querySelector('svg')).not.toBeNull();
    expect(status.textContent).toBe('Signing off');
  });

  it('shows one line, publish cycle first, and counts the rest', async () => {
    const row = await rowOf(
      sp('https://a.example.org', { state: 'Modified', labels: [warning, { ...warning, text: 'Uses extra' }] }),
    );

    expect(row.querySelectorAll('.status')).toHaveLength(1);
    expect(row.querySelector('.status')?.textContent).toBe('Modified, not live');
    expect(within(row).getByText('+2 more').className).toBe('xs faint row-more');
  });

  it('shows the errors of a stored object against the current schema first, with their message', async () => {
    const errors = { text: 'Errors', kind: 'error', title: '/AssertionConsumerService: Missing.' } as const;
    const row = await rowOf(sp('https://a.example.org', { state: 'Modified', labels: [warning, errors] }));
    const status = row.querySelector('.status') as HTMLElement;

    expect(status.className).toBe('status s-danger');
    expect(status.getAttribute('title')).toBe('/AssertionConsumerService: Missing.');
    expect(status.textContent).toBe('Errors');
  });
});
