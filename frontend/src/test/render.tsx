import { render, type RenderResult } from '@testing-library/react';
import { useEffect } from 'react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router';
import { ConsoleRoutes } from '../app/ConsoleRoutes';

const seen: { path: string; go: (delta: number) => void } = { path: '', go: () => undefined };

function Spy() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    seen.path = pathname + search;
    seen.go = (delta) => void navigate(delta);
  }, [pathname, search, navigate]);

  return null;
}

// before: the history entries behind the path.
export function renderAt(path: string, before: string[] = []): RenderResult {
  return render(
    <MemoryRouter initialEntries={[...before, path]} initialIndex={before.length}>
      <ConsoleRoutes />
      <Spy />
    </MemoryRouter>,
  );
}

export function location(): string {
  return seen.path;
}

// Back (-1) or forward (1) in the history, as the browser's buttons do.
export function go(delta: number): void {
  seen.go(delta);
}
