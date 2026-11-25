import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { Callout, type CalloutKind } from './Callout';
import { Card } from './Card';
import { Chip } from './Chip';
import { Row } from './Row';
import { Status } from './Status';

describe('Callout', () => {
  it.each<CalloutKind>(['info', 'warning', 'success'])('renders a %s message with its icon', (kind) => {
    render(<Callout kind={kind} title="Saved." />);

    const callout = screen.getByRole('status');
    expect(callout.className).toBe(`callout callout-${kind}`);
    expect(callout.querySelector('svg')?.getAttribute('class')).toBe(`ic ic-${kind}`);
  });

  it('renders an error as an alert, with its text and action', () => {
    render(
      <Callout kind="error" title="Not saved" action={<a href="/x">Review</a>}>
        Someone else changed this meanwhile.
      </Callout>,
    );

    const callout = screen.getByRole('alert');
    expect(callout.querySelector('.callout-title')?.textContent).toBe('Not saved');
    expect(screen.getByText('Someone else changed this meanwhile.').className).toBe('small');
    expect(screen.getByRole('link', { name: 'Review' })).toBeDefined();
  });
});

describe('Status', () => {
  it('renders a dot and words in the tone of the publish cycle', () => {
    const { container } = render(
      <Status tone="pending" mark="half" note="saved; waits for a Publication">
        Modified
      </Status>,
    );

    expect(container.firstElementChild?.className).toBe('status s-pending');
    expect(container.querySelector('.dot')?.className).toBe('dot dot-half');
    expect(screen.getByText('saved; waits for a Publication').className).toBe('small muted status-note');
  });

  it('renders a plain dot, a warning and a cross', () => {
    const { container } = render(
      <>
        <Status tone="unsaved" mark="dot">
          Unsaved edits
        </Status>
        <Status tone="warn" mark="warning" title="Why">
          Expiring
        </Status>
        <Status tone="danger" mark="cross">
          Not found
        </Status>
      </>,
    );

    expect(container.querySelectorAll('.dot')[0]?.className).toBe('dot');
    expect(screen.getByTitle('Why').querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('svg')).toHaveLength(2);
  });
});

describe('Chip', () => {
  it('renders a boxed fact', () => {
    render(<Chip title="Replaces a feed entity">Override</Chip>);

    expect(screen.getByText('Override').className).toBe('chip');
    expect(screen.getByTitle('Replaces a feed entity')).toBeDefined();
  });
});

describe('Card and Row', () => {
  it('renders rows inside a list card as links, application links or plain rows', () => {
    const { container } = render(
      <MemoryRouter>
        <Card list>
          <Row href="/edit" wrap>
            Edit
          </Row>
          <Row to="/inside">Inside</Row>
          <Row plain>Plain</Row>
        </Card>
        <Card>Alone</Card>
      </MemoryRouter>,
    );

    expect(container.querySelector('.card')?.className).toBe('card card-list');
    expect(screen.getByRole('link', { name: 'Edit' }).className).toBe('row row-wrap');
    expect(screen.getByRole('link', { name: 'Inside' }).className).toBe('row');
    expect(screen.getByText('Plain').tagName).toBe('DIV');
    expect(screen.getByText('Alone').className).toBe('card');
  });
});

describe('Card and Row as a list', () => {
  it('renders a list card of list rows, with their extra classes', () => {
    const { container } = render(
      <Card list as="ul" className="marks">
        <Row plain as="li" className="mark-row">
          Mark
        </Row>
      </Card>,
    );

    expect(container.firstElementChild?.tagName).toBe('UL');
    expect(container.firstElementChild?.className).toBe('card card-list marks');
    expect(screen.getByText('Mark').tagName).toBe('LI');
    expect(screen.getByText('Mark').className).toBe('row mark-row');
  });
});

describe('Row targets', () => {
  it('takes exactly one of a route, an address or plain', () => {
    // @ts-expect-error a row without a target
    const neither = <Row>None</Row>;
    // @ts-expect-error a row with two targets
    const both = (<Row to="/a" href="/b">Both</Row>);

    expect([neither, both]).toHaveLength(2);
  });
});
