import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { page, session, sp, stubApi } from '../app/test/api';
import { renderAt } from '../app/test/render';

const LIST = '/entities/saml20-sp-remote';

function serve(list: ReturnType<typeof page>) {
  return stubApi({ '/api/session': { body: session }, [`/api${LIST}`]: { body: list } });
}

describe('the filter of the service provider list', () => {
  it('filters with the counts the API gives, keeping the search, and asks the API for the filter', async () => {
    const fetch = serve(page([sp('https://a.example.org')], { query: 'lib', counts: { all: 1234, 'not-live': 3, warnings: 0 } }));
    renderAt(`${LIST}?q=lib&filter=not-live`);

    const filter = await screen.findByRole('navigation', { name: 'Filter' });

    expect(filter.textContent).toBe('All 1234Not live 3With warnings 0');
    expect(within(filter).getByRole('link', { name: /^Not live/ }).getAttribute('aria-current')).toBe('true');
    expect(within(filter).getByRole('link', { name: /^All/ }).getAttribute('href')).toBe(`${LIST}?q=lib`);
    expect(within(filter).getByRole('link', { name: /^With warnings/ }).getAttribute('href')).toBe(`${LIST}?q=lib&filter=warnings`);
    expect(fetch).toHaveBeenCalledWith(`/api${LIST}?q=lib&filter=not-live`, expect.anything());
  });

  it('says that nothing matches a filter and offers the whole list', async () => {
    serve(page([], { counts: { all: 4, 'not-live': 0, warnings: 0 } }));
    renderAt(`${LIST}?filter=warnings`);

    await screen.findByRole('heading', { name: 'No service provider matches the filter' });

    expect(screen.getByRole('link', { name: 'Show all' }).getAttribute('href')).toBe(LIST);
  });
});
