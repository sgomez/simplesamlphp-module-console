import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { Button, LinkButton, type ButtonVariant } from './Button';

describe('Button', () => {
  it.each<ButtonVariant>(['primary', 'secondary', 'quiet', 'danger', 'danger-solid', 'global'])(
    'renders the %s variant',
    (variant) => {
      render(<Button variant={variant}>Save</Button>);

      expect(screen.getByRole('button', { name: 'Save' }).className).toBe(`btn btn-${variant}`);
    },
  );

  it('is a secondary button that does not submit by default', () => {
    render(<Button>Open</Button>);

    const button = screen.getByRole('button');
    expect(button.className).toBe('btn btn-secondary');
    expect(button.getAttribute('type')).toBe('button');
  });

  it('renders small, icon-only, loading and menu buttons', () => {
    render(
      <Button variant="quiet" small iconOnly loading menu label="Remove" controls="nav" expanded={false}>
        x
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Remove' });
    expect(button.className).toBe('btn btn-quiet btn-sm btn-icon is-loading menu-btn');
    expect(button.getAttribute('aria-controls')).toBe('nav');
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('calls back on click unless disabled', () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Go</Button>);
    fireEvent.click(screen.getByRole('button'));
    rerender(
      <Button onClick={onClick} disabled type="submit">
        Go
      </Button>,
    );
    fireEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button').getAttribute('type')).toBe('submit');
  });
});

describe('LinkButton', () => {
  it('renders a link to another page', () => {
    render(<LinkButton href="/publish">Review</LinkButton>);

    const link = screen.getByRole('link', { name: 'Review' });
    expect(link.getAttribute('href')).toBe('/publish');
    expect(link.className).toBe('btn btn-secondary');
  });

  it('renders a link inside the application', () => {
    render(
      <MemoryRouter>
        <LinkButton to="/entities" variant="primary" small>
          Next
        </LinkButton>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Next' }).className).toBe('btn btn-primary btn-sm');
  });

  it('renders a disabled link without a target', () => {
    render(
      <LinkButton to="/x" disabled small>
        Previous
      </LinkButton>,
    );

    const link = screen.getByText('Previous');
    expect(link.className).toBe('btn btn-secondary btn-sm is-disabled');
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.hasAttribute('href')).toBe(false);
  });

  it('takes exactly one target, an application route or a page address', () => {
    // @ts-expect-error a link button without a target
    const neither = <LinkButton>None</LinkButton>;
    // @ts-expect-error a link button with both targets
    const both = (<LinkButton to="/a" href="/b">Both</LinkButton>);

    expect([neither, both]).toHaveLength(2);
  });
});
