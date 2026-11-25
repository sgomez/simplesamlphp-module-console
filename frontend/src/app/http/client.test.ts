import { describe, expect, it, vi } from 'vitest';
import { consoleBase, getJson, postJson } from './client';

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

  it('posts JSON with the session token of the page shell and answers the status and body of a refusal', async () => {
    const meta = document.createElement('meta');
    meta.name = 'console-token';
    meta.content = 'abc';
    document.head.append(meta);
    answer(new Response('{"errors":[]}', { status: 422 }));

    const result = await postJson('/entities/saml20-sp-remote/save', { php: 'x' });
    const [url, init] = vi.mocked(fetch).mock.calls[0] ?? [];
    meta.remove();

    expect(result).toEqual({ ok: false, status: 422, body: { errors: [] } });
    expect(url).toBe('/api/entities/saml20-sp-remote/save');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('{"php":"x"}');
    expect(new Headers(init?.headers).get('X-Console-Token')).toBe('abc');
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json');
  });

  it('answers a network failure of a POST with status 0', async () => {
    answer(new TypeError('Failed to fetch'));

    expect(await postJson('/x', {})).toEqual({ ok: false, status: 0, body: null });
  });
});

describe('a POST to the API', () => {
  it('sends the body as JSON with the request-forgery token of the page', async () => {
    const meta = document.createElement('meta');
    meta.name = 'console-token';
    meta.content = 'abc';
    document.head.append(meta);
    answer(new Response('{"number":1}', { status: 200 }));

    expect(await postJson('/publication', { hash: 'h' })).toEqual({ ok: true, data: { number: 1 } });
    expect(fetch).toHaveBeenCalledWith('/api/publication', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Console-Token': 'abc' },
      credentials: 'same-origin',
      body: '{"hash":"h"}',
    });
    meta.remove();
  });

  it('sends an empty token when the page carries none', async () => {
    answer(new Response('{"error":"refused"}', { status: 403 }));

    expect(await postJson('/publication', {})).toEqual({ ok: false, status: 403, body: { error: 'refused' } });
    expect(fetch).toHaveBeenCalledWith(
      '/api/publication',
      expect.objectContaining({ headers: expect.objectContaining({ 'X-Console-Token': '' }) }),
    );
  });

  it('answers a network failure with status 0', async () => {
    answer(new TypeError('Failed to fetch'));

    expect(await postJson('/publication', {})).toEqual({ ok: false, status: 0, body: null });
  });
});

describe('consoleBase', () => {
  it('finds the Console under the module path, wherever SimpleSAMLphp is installed', () => {
    expect(consoleBase('/simplesaml/module.php/console/entities/saml20-sp-remote')).toBe('/simplesaml/module.php/console');
    expect(consoleBase('/module.php/console')).toBe('/module.php/console');
    expect(consoleBase('/elsewhere')).toBe('');
  });
});
