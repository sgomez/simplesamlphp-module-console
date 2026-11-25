import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { Facts } from './Facts';
import { IdentityCard } from './IdentityCard';
import { Row } from './Row';
import { TextLink } from './TextLink';

describe('TextLink', () => {
  it('links to an address or an application route, in the link colour or the text around it', () => {
    render(
      <MemoryRouter>
        <TextLink href="/out">Out</TextLink>
        <TextLink to="/in" inherit>
          In
        </TextLink>
      </MemoryRouter>,
    );

    const out = screen.getByRole('link', { name: 'Out' });
    const inside = screen.getByRole('link', { name: 'In' });
    expect([out.className, out.getAttribute('href')]).toEqual(['link', '/out']);
    expect([inside.className, inside.getAttribute('href')]).toEqual(['link link-inherit', '/in']);
  });

  it('takes exactly one of a route or an address', () => {
    // @ts-expect-error a link without a target
    const neither = <TextLink>None</TextLink>;
    // @ts-expect-error a link with two targets
    const both = (<TextLink to="/a" href="/b">Both</TextLink>);

    expect([neither, both]).toHaveLength(2);
  });
});

describe('Row', () => {
  it('renders a tight row, whose parts wrap closer together', () => {
    render(
      <Row href="/edit" tight>
        Change
      </Row>,
    );

    expect(screen.getByRole('link', { name: 'Change' }).className).toBe('row row-tight');
  });
});

describe('Facts', () => {
  it('lists terms and values, a strong value in bold', () => {
    const { container } = render(<Facts facts={[{ term: 'Becomes', value: 'Snapshot #42', className: 'is-strong' }, { term: 'Nodes', value: '3' }]} />);

    expect(container.innerHTML).toBe(
      '<dl class="facts"><dt class="muted">Becomes</dt><dd class="is-strong">Snapshot #42</dd>' +
        '<dt class="muted">Nodes</dt><dd>3</dd></dl>',
    );
  });
});

describe('IdentityCard', () => {
  it('shows the identity with the admin link and logout', () => {
    render(<IdentityCard identity="admin" adminUrl="/admin" logoutUrl="/logout" />);

    expect(screen.getByText('admin').className).toBe('identity-name');
    expect(screen.getByRole('link', { name: 'Administration' }).className).toBe('identity-link');
    const logout = screen.getByRole('link', { name: 'Log out' });
    expect([logout.className, logout.getAttribute('href'), logout.getAttribute('title')]).toEqual([
      'logout',
      '/logout',
      'Log out',
    ]);
  });
});
