import { within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { sp } from '../app/test/api';
import { rowOf } from '../app/test/list';

describe('a disabled or Unreadable row of the list', () => {
  it('strikes through the name of a disabled object and marks it with a minus', async () => {
    const row = await rowOf(
      sp('https://a.example.org', { name: 'Old intranet', labels: [{ text: 'Disabled', kind: 'disabled', title: null }] }),
    );

    expect(within(row).getByText('Old intranet').className).toBe('row-name is-off');
    expect(row.querySelector('.dot')?.className).toBe('dot dot-minus');
    expect(row.querySelector('.status')?.textContent).toBe('Disabled');
  });

  it('shows a disabled object with a Pending change as disabled, not published', async () => {
    const row = await rowOf(
      sp('https://a.example.org', { state: 'Modified', labels: [{ text: 'Disabled', kind: 'disabled', title: null }] }),
    );

    expect(row.querySelectorAll('.status')).toHaveLength(1);
    expect(row.querySelector('.status')?.className).toBe('status s-pending');
    expect(row.querySelector('.status')?.textContent).toBe('Disabled, not published');
  });

  it('lists an Unreadable row with its load error and no link', async () => {
    const row = await rowOf(
      sp('https://bad.example.org', {
        state: 'Unreadable',
        unreadable: true,
        error: 'The stored document is not valid JSON.',
      }),
    );

    expect(row.tagName).toBe('DIV');
    expect(row.querySelector('.status')?.className).toBe('status s-danger');
    expect(row.querySelector('.dot')?.className).toBe('dot dot-full');
    expect(within(row).getByText('The stored document is not valid JSON.').className).toBe('xs faint row-more');
  });

  it('lists a disabled Unreadable row as Unreadable, with its load error and no link', async () => {
    const row = await rowOf(
      sp('https://bad.example.org', {
        state: null,
        unreadable: true,
        labels: [{ text: 'Disabled', kind: 'disabled', title: null }],
        error: 'The stored document is not valid JSON.',
      }),
    );

    expect(row.tagName).toBe('DIV');
    expect(row.querySelector('.status')?.textContent).toBe('Unreadable');
    expect(row.querySelector('.status')?.className).toBe('status s-danger');
    expect(within(row).getByText('The stored document is not valid JSON.').className).toBe('xs faint row-more');
  });
});
