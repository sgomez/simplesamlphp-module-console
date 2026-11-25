import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { session } from './test/api';
import { Shell } from './Shell';

describe('the breadcrumb', () => {
  it('wraps the current crumb anywhere, so an entity ID never widens the screen', () => {
    const entityId = 'https://moodle.example.edu/auth/saml2/sp/metadata.php';
    render(
      <MemoryRouter>
        <Shell session={session} pending={0} crumbs={[{ label: 'Service providers', to: '/entities/saml20-sp-remote' }, { label: entityId }]}>
          {null}
        </Shell>
      </MemoryRouter>,
    );

    expect(screen.getByText(entityId).className).toBe('crumb-current wrap-any');
  });
});
