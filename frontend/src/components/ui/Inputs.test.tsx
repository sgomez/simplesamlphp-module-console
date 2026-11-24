import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Check } from './Check';
import { Field } from './Field';
import { Input } from './Input';
import { Select } from './Select';
import { Switch } from './Switch';
import { TextArea } from './TextArea';

describe('Input', () => {
  it('renders a text input that reports its value', () => {
    const onChange = vi.fn();
    render(<Input label="Name" value="a" onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Name' });

    fireEvent.change(input, { target: { value: 'b' } });

    expect(input.className).toBe('input');
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('renders monospace, invalid and disabled inputs', () => {
    render(<Input label="URL" type="url" mono invalid disabled defaultValue="x" />);
    const input = screen.getByRole('textbox', { name: 'URL' });

    expect(input.className).toBe('input mono is-error');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect((input as HTMLInputElement).disabled).toBe(true);
  });
});

describe('Field', () => {
  it('labels its control and shows help and the error', () => {
    render(
      <Field id="acs" label="Location" help="Where responses go." error="Enter the full URL.">
        <Input id="acs" />
      </Field>,
    );

    expect(screen.getByRole('textbox', { name: 'Location' })).toBeDefined();
    expect(screen.getByText('Where responses go.').className).toBe('help');
    expect(screen.getByRole('alert').className).toBe('msg-error');
    expect(screen.getByRole('alert').textContent).toBe('Enter the full URL.');
  });

  it('shows neither help nor error when there are none', () => {
    const { container } = render(
      <Field id="x" label="X">
        <Input id="x" />
      </Field>,
    );

    expect(container.querySelector('.help, .msg-error')).toBeNull();
    expect(container.firstElementChild?.className).toBe('field');
  });
});

describe('Select', () => {
  it('offers its options and reports the choice', () => {
    const onChange = vi.fn();
    render(<Select label="Format" value="persistent" options={['persistent', 'transient']} onChange={onChange} />);
    const select = screen.getByRole('combobox', { name: 'Format' });

    fireEvent.change(select, { target: { value: 'transient' } });

    expect(select.className).toBe('input');
    expect(onChange).toHaveBeenCalledWith('transient');
  });
});

describe('TextArea', () => {
  it('renders a monospace text area that reports its value', () => {
    const onChange = vi.fn();
    render(<TextArea label="PEM" value="" mono invalid onChange={onChange} />);
    const area = screen.getByRole('textbox', { name: 'PEM' });

    fireEvent.change(area, { target: { value: 'abc' } });

    expect(area.className).toBe('input mono is-error');
    expect(onChange).toHaveBeenCalledWith('abc');
  });
});

describe('Switch', () => {
  it('carries the word On or Off and reports the change', () => {
    const onChange = vi.fn();
    const { rerender } = render(<Switch label="Enabled" checked onChange={onChange} />);
    const control = screen.getByRole('switch', { name: 'Enabled' });

    fireEvent.click(control);
    expect(onChange).toHaveBeenCalledWith(false);
    expect(control.className).toBe('switch');
    expect(screen.getByText('On')).toBeDefined();

    rerender(<Switch label="Enabled" checked={false} onChange={onChange} />);
    expect(screen.getByText('Off')).toBeDefined();
  });
});

describe('Check', () => {
  it('renders a labelled checkbox or radio', () => {
    const onChange = vi.fn();
    const { rerender } = render(<Check label="Checkbox" checked={false} onChange={onChange} />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Checkbox' }));
    expect(onChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('checkbox').className).toBe('check');

    rerender(<Check label="Radio" type="radio" name="r" checked onChange={onChange} />);
    expect(screen.getByRole('radio', { name: 'Radio' })).toBeDefined();
  });
});
