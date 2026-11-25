import { act, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ENTITY, page } from '../../test/api';
import { CREATED, created, saveNew } from '../../test/add';
import { editor } from '../../test/edit';
import { go, location } from '../../test/render';

const LIST = '/entities/saml20-sp-remote';

describe('adding a service provider, in the history', () => {
  it('replaces the add screen with the edit screen, so Back returns to the list', async () => {
    await saveNew({ body: created }, { [`/api${LIST}`]: { body: page([]) } }, [LIST]);
    await waitFor(() => expect(location()).toBe(CREATED));

    act(() => go(-1));

    await waitFor(() => expect(location()).toBe(LIST));
  });

  it('opens the entity as it now stands on Forward, without saying Saved again', async () => {
    const now = { ...created, version: 2, php: 'as it now stands', notices: [] };
    await saveNew(
      { body: created },
      { [`/api${LIST}`]: { body: page([]) }, [`${ENTITY}?entityid=https%3A%2F%2Fnew.example.org`]: { body: now } },
      [LIST],
    );
    await screen.findByText('Saved. Not live yet.');

    act(() => go(-1));
    await waitFor(() => expect(location()).toBe(LIST));
    act(() => go(1));

    await waitFor(() => expect(editor().value).toBe('as it now stands'));
    expect(location()).toBe(CREATED);
    expect(screen.queryByText('Saved. Not live yet.')).toBeNull();
  });
});
