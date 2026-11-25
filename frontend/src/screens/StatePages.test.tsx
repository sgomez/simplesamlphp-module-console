import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { refusal, session, stubApi } from '../app/test/api';
import { renderAt } from '../app/test/render';
import { crumb, expectStateShell, LIST, serveState } from '../app/test/states';

function buttons() {
  return screen.queryAllByRole('button').filter((button) => button.textContent !== '');
}

describe('the state pages', () => {
  it.each(['/', LIST, '/nowhere'])('stand in for the screen at %s', async (path) => {
    serveState({ state: 'Unreachable' });
    renderAt(path);

    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe('Database unreachable');
  });

  it('keep the sidebar with the identity, without any count', async () => {
    serveState({ state: 'Unreachable' });
    const { container } = renderAt(LIST);

    expect((await screen.findByText('admin')).className).toBe('identity-name');
    expect(screen.getByRole('link', { name: 'Log out' }).getAttribute('href')).toBe(session.logoutUrl);
    expectStateShell(container);
  });

  it('show Database unreachable with the driver message folded away', async () => {
    serveState({ state: 'Unreachable', detail: 'SQLSTATE[HY000] [2002] Connection refused' });
    const { container } = renderAt(LIST);

    await screen.findByRole('heading', { name: 'Database unreachable' });
    expect(crumb().textContent).toBe('Database unreachable');
    expect(container.querySelector('.state-card')?.className).toBe('card empty state-card');
    const text = 'The Console cannot reach its database. Nodes keep serving their local Snapshot.';
    expect(screen.getByText(text).className).toBe('muted empty-text');
    const details = container.querySelector('details.grp') as HTMLElement;
    expect(details.hasAttribute('open')).toBe(false);
    expect(within(details).getByText('Technical detail').className).toBe('small');
    expect(screen.getByLabelText('Technical detail').textContent).toBe('SQLSTATE[HY000] [2002] Connection refused');
    expect(buttons()).toEqual([]);
  });

  it('show SQLite too old with the version found and the minimum', async () => {
    serveState({ state: 'SqliteTooOld', sqliteVersion: '3.22.0' });
    const { container } = renderAt(LIST);

    await screen.findByRole('heading', { name: 'SQLite too old' });
    expect(crumb().textContent).toBe('SQLite too old');
    const facts = container.querySelector('dl.facts') as HTMLElement;
    expect([...facts.children].map((el) => el.textContent)).toEqual(['Found', '3.22.0', 'Minimum', '3.24.0']);
    expect(facts.querySelectorAll('dd')[0]?.className).toBe('mono is-strong');
    expect(buttons()).toEqual([]);
    expectStateShell(container);
  });

  it('show Console older than the database with both schema versions and no button', async () => {
    serveState({ state: 'ConsoleOlder', known: 9, highest: 11 });
    const { container } = renderAt(LIST);

    await screen.findByRole('heading', { name: 'Console older than the database' });
    const facts = container.querySelector('dl.facts') as HTMLElement;
    expect([...facts.children].map((el) => el.textContent)).toEqual([
      'This Console knows',
      'Schema 9',
      'The database holds',
      'Schema 11',
    ]);
    expect(container.querySelector('.empty-text')?.textContent).toBe(
      'Update sgomez/simplesamlphp-module-console on this node.',
    );
    expect(buttons()).toEqual([]);
  });

  it('replace a screen whose own request is refused', async () => {
    stubApi({ '/api/session': { body: session }, [`/api${LIST}`]: refusal({ state: 'ConsoleOlder', highest: 10 }) });
    const { container } = renderAt(LIST);

    expect(await screen.findByRole('heading', { name: 'Console older than the database' })).toBeDefined();
    expect(screen.queryByRole('heading', { name: 'Service providers' })).toBeNull();
    expectStateShell(container);
  });
});
