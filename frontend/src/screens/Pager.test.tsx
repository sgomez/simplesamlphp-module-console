import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { page, session, sp, stubApi } from '../test/api';
import { renderAt } from '../test/render';

const LIST = '/entities/saml20-sp-remote';

function serve(answer: ReturnType<typeof page>) {
  stubApi({ '/api/session': { body: session }, [`/api${LIST}`]: { body: answer } });
}

describe('the pagination of the list', () => {
  it('shows the range and the total of a single page, without page buttons', async () => {
    serve(page([sp('https://a.example.org')]));
    renderAt(LIST);

    expect((await screen.findByText(/^1 to 1 of 1/)).textContent).toBe('1 to 1 of 1 service provider');
    expect(screen.queryByText('Previous')).toBeNull();
    expect(screen.queryByText('Next')).toBeNull();
  });

  it('pages forward keeping the search, with Previous disabled on the first page', async () => {
    serve(page([sp('https://a.example.org')], { total: 30, pages: 2, query: 'example' }));
    renderAt(`${LIST}?q=example`);

    expect((await screen.findByText(/^1 to 25/)).textContent).toBe('1 to 25 of 30 service providers');
    expect(screen.getByText('Page 1 of 2').className).toBe('small muted');
    expect(screen.getByText('Previous').getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByText('Previous').className).toBe('btn btn-secondary btn-sm is-disabled');
    expect(screen.getByRole('link', { name: 'Next' }).getAttribute('href')).toBe(`${LIST}?q=example&page=2`);
  });

  it('pages back from the last page, with Next disabled', async () => {
    serve(page([sp('https://a.example.org')], { total: 30, page: 2, pages: 2 }));
    renderAt(`${LIST}?page=2`);

    expect((await screen.findByText(/^26 to 30/)).textContent).toBe('26 to 30 of 30 service providers');
    expect(screen.getByRole('link', { name: 'Previous' }).getAttribute('href')).toBe(`${LIST}?page=1`);
    expect(screen.getByText('Next').getAttribute('aria-disabled')).toBe('true');
  });
});
