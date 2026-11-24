import { render, type RenderResult } from '@testing-library/react';
import { useEffect } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { ConsoleRoutes } from '../app/ConsoleRoutes';

const seen = { path: '' };

function Spy() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    seen.path = pathname + search;
  }, [pathname, search]);

  return null;
}

export function renderAt(path: string): RenderResult {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ConsoleRoutes />
      <Spy />
    </MemoryRouter>,
  );
}

export function location(): string {
  return seen.path;
}
