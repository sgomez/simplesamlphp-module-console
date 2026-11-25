import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Menu, MenuButton } from './Menu';

describe('Menu', () => {
  it('lists actions, a separated danger entry last, with no menu roles', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <Menu
        entries={[
          { label: 'Download', onSelect: vi.fn() },
          { label: 'Delete…', onSelect, danger: true, separated: true },
        ]}
      />,
    );

    expect(container.firstElementChild?.className).toBe('card menu menu-card');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.queryByRole('menuitem')).toBeNull();
    expect(screen.getByRole('button', { name: 'Download' }).className).toBe('nav-item');
    const action = screen.getByRole('button', { name: 'Delete…' });
    expect(action.className).toBe('nav-item is-danger');
    expect(action.getAttribute('type')).toBe('button');
    expect(container.querySelectorAll('hr')).toHaveLength(1);

    fireEvent.click(action);

    expect(onSelect).toHaveBeenCalledOnce();
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

  function popup() {
    return document.querySelector('.menu-pop');
  }

  it('discloses its entries below the button and hides them again', () => {
    more();

    expect(opener().hasAttribute('aria-haspopup')).toBe(false);
    expect(opener().getAttribute('aria-expanded')).toBe('false');
    expect(popup()).toBeNull();

    fireEvent.click(opener());

    expect(opener().getAttribute('aria-expanded')).toBe('true');
    expect(opener().className).toBe('btn btn-secondary');
    expect(popup()?.className).toBe('card menu menu-pop');
    expect(opener().getAttribute('aria-controls')).toBe(popup()?.id);
    expect(opener().parentElement?.className).toBe('menu-anchor');

    fireEvent.click(opener());

    expect(popup()).toBeNull();
  });

  it('closes after an entry is chosen and hands the focus back to the button first', () => {
    let focused: Element | null = null;
    more(
      vi.fn(() => {
        focused = document.activeElement;
      }),
    );
    fireEvent.click(opener());

    fireEvent.click(screen.getByRole('button', { name: 'Delete…' }));

    expect(focused).toBe(opener());
    expect(popup()).toBeNull();
  });

  it('closes on Escape with the focus back on the button', () => {
    more();
    fireEvent.click(opener());
    screen.getByRole('button', { name: 'Delete…' }).focus();

    fireEvent.keyDown(document, { key: 'Tab' });
    expect(popup()).not.toBeNull();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(popup()).toBeNull();
    expect(document.activeElement).toBe(opener());
  });

  it('closes on a press outside it, not on a press inside it', () => {
    more();
    fireEvent.click(opener());

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Delete…' }));
    expect(popup()).not.toBeNull();

    fireEvent.pointerDown(screen.getByText('Elsewhere'));
    expect(popup()).toBeNull();
  });
});
