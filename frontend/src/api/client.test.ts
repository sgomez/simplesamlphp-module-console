import { describe, expect, it, vi } from 'vitest';
import { getJson } from './client';

function answer(response: Response | Error) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      if (response instanceof Error) {
        throw response;
      }

      return response;
    }),
  );
}

describe('the API client', () => {
  it('answers the data of a success', async () => {
    answer(new Response('{"identity":"admin"}', { status: 200 }));

    expect(await getJson('/session')).toEqual({ ok: true, data: { identity: 'admin' } });
  });

  it('answers the status and the JSON body of a refusal', async () => {
    answer(new Response('{"state":"MigrationsPending"}', { status: 503 }));

    expect(await getJson('/session')).toEqual({ ok: false, status: 503, body: { state: 'MigrationsPending' } });
  });

  it('answers a refusal without a JSON body with a null body', async () => {
    answer(new Response('<html>Not found</html>', { status: 404 }));

    expect(await getJson('/nowhere')).toEqual({ ok: false, status: 404, body: null });
  });

  it('answers a success it cannot read as a failure', async () => {
    answer(new Response('not json', { status: 200 }));

    expect(await getJson('/session')).toEqual({ ok: false, status: 200, body: null });
  });

  it('reloads the page on a lost session, so core asks for login', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { pathname: '/simplesaml/module.php/console/', reload });
    answer(new Response('{"error":"unauthenticated"}', { status: 401 }));

    expect(await getJson('/session')).toEqual({ ok: false, status: 401, body: { error: 'unauthenticated' } });
    expect(reload).toHaveBeenCalledOnce();
  });

  it('does not reload the page on any other refusal', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { pathname: '/', reload });
    answer(new Response('{"error":"refused"}', { status: 403 }));

    await getJson('/session');

    expect(reload).not.toHaveBeenCalled();
  });

  it('answers a network failure with status 0', async () => {
    answer(new TypeError('Failed to fetch'));

    expect(await getJson('/session')).toEqual({ ok: false, status: 0, body: null });
  });
});
