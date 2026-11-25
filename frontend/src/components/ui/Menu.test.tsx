import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Menu, MenuButton } from './Menu';

describe('Menu', () => {
  it('lists its entries, a separated danger entry last', () => {
    const { container } = render(
      <Menu
        label="More actions"
        entries={[
          { label: 'Replace from…', href: '/replace' },
          { label: 'Delete…', href: '/delete', danger: true, separated: true },
        ]}
      />,
    );

    expect(screen.getByRole('menu', { name: 'More actions' }).className).toBe('card menu menu-card');
    expect(screen.getByRole('menuitem', { name: 'Replace from…' }).className).toBe('nav-item');
    expect(screen.getByRole('menuitem', { name: 'Delete…' }).className).toBe('nav-item is-danger');
    expect(container.querySelectorAll('hr')).toHaveLength(1);
  });

  it('runs an action entry instead of following a link', () => {
    const onSelect = vi.fn();
    render(<Menu label="More actions" entries={[{ label: 'Delete…', onSelect, danger: true }]} />);

    const item = screen.getByRole('menuitem', { name: 'Delete…' });
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    fireEvent(item, click);

    expect(onSelect).toHaveBeenCalledOnce();
    expect(click.defaultPrevented).toBe(true);
    expect(item.className).toBe('nav-item is-danger');
  });
});

describe('MenuButton', () => {
  function more(onSelect = vi.fn()) {
    return render(
      <>
        <MenuButton label="More actions" entries={[{ label: 'Delete…', onSelect, danger: true }]} />
        <p>Elsewhere</p>
      </>,
    );
  }

  function opener() {
    return screen.getByRole('button', { name: 'More actions' });
  }

  it('opens its menu below the button and closes it again', () => {
    more();

    expect(opener().getAttribute('aria-haspopup')).toBe('menu');
    expect(opener().getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('menu')).toBeNull();

    fireEvent.click(opener());

    expect(opener().getAttribute('aria-expanded')).toBe('true');
    expect(opener().className).toBe('btn btn-secondary');
    expect(screen.getByRole('menu', { name: 'More actions' }).className).toBe('card menu menu-pop');
    expect(opener().parentElement?.className).toBe('menu-anchor');

    fireEvent.click(opener());

    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('closes after an entry is chosen', () => {
    const onSelect = vi.fn();
    more(onSelect);
    fireEvent.click(opener());

    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete…' }));

    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('closes on Escape and on a press outside it, not on a press inside it', () => {
    more();
    fireEvent.click(opener());

    fireEvent.pointerDown(screen.getByRole('menuitem', { name: 'Delete…' }));
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByRole('menu')).toBeDefined();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();

    fireEvent.click(opener());
    fireEvent.pointerDown(screen.getByText('Elsewhere'));
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
