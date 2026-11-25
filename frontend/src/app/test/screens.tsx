import { render, type RenderResult } from '@testing-library/react';
import { useEffect } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { LinkRouter } from '../../design-system/LinkRouter';
import { StoryScreens, type ScreenPorts } from './StoryScreens';

const seen = { path: '' };

function Spy() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    seen.path = pathname + search;
  }, [pathname, search]);

  return null;
}

// The screens not served yet, at a path, over in-memory ports.
export function renderScreen(path: string, ports: ScreenPorts = {}): RenderResult {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LinkRouter>
        <StoryScreens {...ports} />
        <Spy />
      </LinkRouter>
    </MemoryRouter>,
  );
}

export function screenPath(): string {
  return seen.path;
}
