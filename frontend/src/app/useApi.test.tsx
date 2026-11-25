import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { stubApi } from '../test/api';
import { useApi } from './useApi';

describe('useApi', () => {
  it('is loading, then ready with the data', async () => {
    stubApi({ '/api/session': { body: { identity: 'admin' } } });
    const { result } = renderHook(() => useApi('/session'));

    expect(result.current).toEqual({ state: 'loading' });
    await waitFor(() => expect(result.current).toEqual({ state: 'ready', data: { identity: 'admin' } }));
  });

  it('fails with the status and body of a refusal', async () => {
    stubApi({ '/api/session': { status: 503, body: { state: 'Unreachable' } } });
    const { result } = renderHook(() => useApi('/session'));

    await waitFor(() =>
      expect(result.current).toEqual({ state: 'failed', status: 503, body: { state: 'Unreachable' } }),
    );
  });

  it('fails with status 0 when the request cannot be made', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('offline'))));
    const { result } = renderHook(() => useApi('/session'));

    await waitFor(() => expect(result.current).toEqual({ state: 'failed', status: 0, body: null }));
  });

  it('is loading again for another path until it answers', async () => {
    stubApi({ '/api/a': { body: 'a' }, '/api/b': { body: 'b' } });
    const { result, rerender } = renderHook(({ path }) => useApi(path), { initialProps: { path: '/a' } });
    await waitFor(() => expect(result.current).toEqual({ state: 'ready', data: 'a' }));

    rerender({ path: '/b' });

    expect(result.current).toEqual({ state: 'loading' });
    await waitFor(() => expect(result.current).toEqual({ state: 'ready', data: 'b' }));
  });

  it('asks again for a new revision of the same path, keeping the last answer until the new one arrives', async () => {
    let n = 0;
    const fetch = stubApi({ '/api/a': () => ({ body: (n += 1) }) });
    const { result, rerender } = renderHook(({ revision }) => useApi('/a', { revision }), { initialProps: { revision: 0 } });
    await waitFor(() => expect(result.current).toEqual({ state: 'ready', data: 1 }));

    rerender({ revision: 1 });

    expect(result.current).toEqual({ state: 'ready', data: 1 });
    await waitFor(() => expect(result.current).toEqual({ state: 'ready', data: 2 }));
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
