import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { stubApi } from '../test/api';
import { ReportFailure, useFailure, type Failure } from './failure';
import { useApi } from './useApi';

function withReport(report: (failure: Failure) => void) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <ReportFailure value={report}>{children}</ReportFailure>;
  };
}

describe('useFailure', () => {
  it('takes over 401, 403 and 404 and leaves every other status to the screen', () => {
    const report = vi.fn();
    const { result } = renderHook(() => useFailure(), { wrapper: withReport(report) });

    expect([401, 403, 404, 409, 422, 503, 0].map((status) => result.current(status))).toEqual([
      true,
      true,
      true,
      false,
      false,
      false,
      false,
    ]);
    expect(report.mock.calls).toEqual([[{ status: 403 }], [{ status: 404 }]]);
  });

  it('reports the entity ID of a missing object', () => {
    const report = vi.fn();
    const { result } = renderHook(() => useFailure(), { wrapper: withReport(report) });

    result.current(404, 'https://sp.example.org');

    expect(report).toHaveBeenCalledWith({ status: 404, entityId: 'https://sp.example.org' });
  });

  it('is reported by useApi for the object a screen asked for', async () => {
    stubApi({ '/api/entities/saml20-sp-remote/entity': { status: 404, body: { error: 'not found' } } });
    const report = vi.fn();
    const path = '/entities/saml20-sp-remote/entity?entityid=https%3A%2F%2Fsp.example.org';

    renderHook(() => useApi(path, { entityId: 'https://sp.example.org' }), { wrapper: withReport(report) });

    await waitFor(() => expect(report).toHaveBeenCalledWith({ status: 404, entityId: 'https://sp.example.org' }));
  });
});
