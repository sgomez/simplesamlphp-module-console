import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { review } from '../app/test/api';
import { CURRENT, EDIT_A, EDIT_M, PUBLISH, ready, servePublication, shown } from '../app/test/publication';
import { location, renderAt } from '../app/test/render';

describe('the Publish screen', () => {
  it('says there is nothing to publish and what is live, and offers no Publication', async () => {
    servePublication([review({ current: CURRENT, nextNumber: 42 })]);
    renderAt(PUBLISH);

    const empty = await screen.findByRole('heading', { name: 'Nothing to publish' });

    expect(empty.parentElement?.className).toBe('card empty');
    expect(screen.getByText('Everything saved is live in Snapshot #41.').className).toBe('muted empty-text');
    expect(empty.parentElement?.querySelector('.empty-actions')).toBeNull();
    expect(screen.queryByRole('complementary')).toBeNull();
  });

  it('says only that there is nothing to publish before the first Publication', async () => {
    servePublication([review()]);
    renderAt(PUBLISH);

    const empty = await screen.findByRole('heading', { name: 'Nothing to publish' });

    expect(empty.parentElement?.querySelector('p')).toBeNull();
  });

  it('lists every Pending change in the order of SPEC 10.14, by name or identifier, linking to the ones that open', async () => {
    servePublication([ready]);
    await shown();
    const list = document.querySelector('.card-list') as HTMLElement;

    const rows = Array.from(list.children).map((row) => [
      row.tagName,
      row.className,
      row.querySelector('.change-sign')?.textContent,
      row.querySelector('.change-verb')?.textContent,
      row.querySelector('.row-name')?.textContent,
      row.querySelector('.small.faint')?.textContent,
      row.getAttribute('href'),
    ]);

    expect(rows).toEqual([
      ['A', 'row row-tight', '~', 'Modified', 'https://m.example.org', 'Service provider', EDIT_M],
      ['A', 'row row-tight', '+', 'Added', 'Alpha', 'Service provider', EDIT_A],
      ['DIV', 'row row-tight', '×', 'Deleted', 'Delta', 'Service provider', null],
      ['DIV', 'row row-tight', '!', 'Unreadable', 'https://u.example.org', 'Service provider', null],
    ]);
    expect(within(list).getByText('Syntax error').className).toBe('small muted change-end');
  });

  it('opens the edit screen of a change inside the Console, without reloading the page', async () => {
    servePublication([ready]);
    await shown();

    fireEvent.click(within(document.querySelector('.card-list') as HTMLElement).getAllByRole('link')[0] as HTMLElement);

    expect(location()).toBe(EDIT_M);
  });

  it('heads the changes with their count and the Snapshot they are compared with', async () => {
    servePublication([ready]);
    await shown();

    const head = screen.getByRole('heading', { name: '4 changes' });

    expect(head.parentElement?.className).toBe('section-head');
    expect(within(head.parentElement as HTMLElement).getByText('against Snapshot #41').className).toBe('small faint');
  });

  it('counts a single change and names no Snapshot before the first Publication', async () => {
    servePublication([review({ groups: ready.groups.slice(0, 1), canPublish: true })]);
    await shown();

    expect(screen.getByRole('heading', { name: '1 change' }).parentElement?.childElementCount).toBe(1);
    expect(screen.getByRole('button', { name: 'Publish 1 change' })).toBeDefined();
  });

  it('is ready: the panel holds the next number, the optional comment and Publish', async () => {
    servePublication([ready]);
    const panel = await shown();

    expect(screen.getByRole('status').textContent).toBe('Ready to publish');
    expect(panel.className).toBe('card publish-panel');
    expect(within(panel).getByRole('heading', { level: 2 }).textContent).toBe('This Publication');
    expect(within(panel).getByText('Becomes').tagName).toBe('DT');
    expect(within(panel).getByText('Snapshot #42').className).toBe('is-strong');
    expect(within(panel).getByRole('textbox', { name: 'Comment (optional)' })).toBeDefined();
    expect((within(panel).getByRole('button', { name: 'Publish 4 changes' }) as HTMLButtonElement).disabled).toBe(
      false,
    );
    expect(within(panel).queryByText('Nodes')).toBeNull();
    expect(screen.queryByText(/Discard/)).toBeNull();
    expect(screen.queryByRole('button', { name: /Alpha/ })).toBeNull();
  });
});
