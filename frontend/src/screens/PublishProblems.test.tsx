import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { review } from '../app/test/api';
import { EDIT_A, ready, servePublication, shown } from '../app/test/publication';

describe('the problems and warnings of the Publish screen', () => {
  it('lists the problems first, each linking to its object, and says why Publish is not offered', async () => {
    servePublication([
      review({
        ...ready,
        canPublish: false,
        problems: [
          { entityId: 'https://a.example.org', message: 'No ACS.' },
          { entityId: null, message: 'The Snapshot is too large.' },
        ],
      }),
    ]);
    const panel = await shown();
    const alert = screen.getByRole('alert');

    expect(alert.querySelector('.callout-title')?.textContent).toBe('2 problems block publishing');
    expect(within(alert).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'https://a.example.org: No ACS.',
      'The Snapshot is too large.',
    ]);
    expect(within(alert).getByRole('link', { name: 'https://a.example.org' }).getAttribute('href')).toBe(EDIT_A);
    expect(within(alert).getByRole('link').className).toBe('link link-inherit');
    expect(alert.compareDocumentPosition(document.querySelector('.card-list') as Node)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(screen.queryByText('Ready to publish')).toBeNull();
    expect((within(panel).getByRole('button', { name: 'Publish 4 changes' }) as HTMLButtonElement).disabled).toBe(true);
    expect(within(panel).getByText('Fix 2 problems to publish.').className).toBe('msg-error');
  });

  it('names a single problem in the singular, as a line rather than a list', async () => {
    const problem = { entityId: 'https://a.example.org', message: 'No ACS.' };
    servePublication([review({ ...ready, canPublish: false, problems: [problem] })]);
    const panel = await shown();
    const alert = screen.getByRole('alert');

    expect(alert.querySelector('.callout-title')?.textContent).toBe('1 problem blocks publishing');
    expect(within(alert).queryByRole('list')).toBeNull();
    expect(within(alert).getByText(/No ACS\./).className).toBe('small');
    expect(within(alert).getByRole('link', { name: 'https://a.example.org' }).getAttribute('href')).toBe(EDIT_A);
    expect(within(panel).getByText('Fix 1 problem to publish.')).toBeDefined();
  });

  it('keeps the warnings collapsed, each linking to its object', async () => {
    servePublication([
      review({
        ...ready,
        warnings: [
          { entityId: 'https://a.example.org', message: 'The certificate expires in 12 days.' },
          { entityId: null, message: 'A collision.' },
        ],
      }),
    ]);
    await shown();

    const summary = screen.getByText('2 warnings');
    const group = summary.closest('details') as HTMLDetailsElement;

    expect(group.className).toBe('grp card');
    expect(group.open).toBe(false);
    expect(Array.from(group.querySelectorAll('.msg-warning')).map((w) => w.textContent)).toEqual([
      'https://a.example.org: The certificate expires in 12 days.',
      'A collision.',
    ]);
    expect(within(group).getByRole('link').getAttribute('href')).toBe(EDIT_A);
    expect(within(group).getByRole('link').className).toBe('link link-inherit');
  });

  it('counts a single warning in the singular', async () => {
    servePublication([review({ ...ready, warnings: [{ entityId: null, message: 'A collision.' }] })]);
    await shown();

    expect(screen.getByText('1 warning').className).toBe('row-name');
  });
});
