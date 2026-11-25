import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { EntityRow } from '../api/types';
import { page, session, sp, stubApi } from '../test/api';
import { renderAt } from '../test/render';

const LIST = '/entities/saml20-sp-remote';

async function rowOf(entity: EntityRow) {
  stubApi({ '/api/session': { body: session }, [`/api${LIST}`]: { body: page([entity]) } });
  renderAt(LIST);
  const id = await screen.findByTitle(entity.entityId);

  return id.closest('.row') as HTMLElement;
}

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
    expect(modified.querySelector('.status')?.textContent).toBe('Modified');
  });

  it('shows Unpublished with an empty dot', async () => {
    const row = await rowOf(sp('https://a.example.org', { state: 'Unpublished' }));

    expect(row.querySelector('.dot')?.className).toBe('dot');
    expect(row.querySelector('.status')?.textContent).toBe('Unpublished');
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
    expect(row.querySelector('.status')?.textContent).toBe('Modified');
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

  it('strikes through the name of a disabled object and marks it with a minus', async () => {
    const row = await rowOf(
      sp('https://a.example.org', { name: 'Old intranet', labels: [{ text: 'Disabled', kind: 'disabled', title: null }] }),
    );

    expect(within(row).getByText('Old intranet').className).toBe('row-name is-off');
    expect(row.querySelector('.dot')?.className).toBe('dot dot-minus');
    expect(row.querySelector('.status')?.textContent).toBe('Disabled');
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
