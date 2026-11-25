import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { entity, page, session, stubApi } from '../test/api';
import { location, renderAt } from '../test/render';

const LIST = '/entities/saml20-sp-remote';

function serve(list: ReturnType<typeof page>) {
  return stubApi({ '/api/session': { body: session }, [`/api${LIST}`]: { body: list } });
}

describe('the service provider list, empty', () => {
  it('says there are no service providers yet, with neither search box nor pager', async () => {
    serve(page([], { total: 0, pages: 0 }));
    const { container } = renderAt(LIST);

    const empty = await screen.findByRole('heading', { level: 2, name: 'No service providers yet' });

    expect(empty.parentElement?.className).toBe('card empty');
    expect(empty.parentElement?.childElementCount).toBe(1);
    expect(screen.queryByRole('search')).toBeNull();
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).toBeNull();
    expect(container.querySelector('.card-list')).toBeNull();
    expect(screen.getByRole('link', { name: 'Add' })).toBeDefined();
  });

  it('opens the add screen in the Console, without reloading the page', async () => {
    stubApi({
      '/api/session': { body: session },
      [`/api${LIST}`]: { body: page([]) },
      '/api/entities/saml20-sp-remote/entity': { body: entity({ entityId: '', version: 0 }) },
    });
    renderAt(LIST);

    fireEvent.click(await screen.findByRole('link', { name: 'Add' }));

    await waitFor(() => expect(location()).toBe(`${LIST}/new`));
  });
});
