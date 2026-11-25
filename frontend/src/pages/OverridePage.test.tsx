import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { boardComparison } from '../app/adapters/memory/overrides';
import { renderScreen, screenPath } from '../app/test/screens';

const ENTITY = boardComparison.entityId;
const PATH = `/entities/saml20-sp-remote/override?entityid=${encodeURIComponent(ENTITY)}`;

describe('the Override comparison', () => {
  it('returns to the edit screen once marked as reviewed', async () => {
    renderScreen(PATH);

    fireEvent.click(await screen.findByRole('button', { name: 'Mark as reviewed' }));

    await waitFor(() => expect(screenPath()).toBe(`/entities/saml20-sp-remote/edit?entityid=${encodeURIComponent(ENTITY)}`));
  });

  it('stays and says why when marking fails', async () => {
    renderScreen(PATH, { overrides: { review: { status: 500, body: null } } });

    fireEvent.click(await screen.findByRole('button', { name: 'Mark as reviewed' }));

    expect(await screen.findByText('Not marked as reviewed: the server answered 500.')).toBeTruthy();
    expect(screenPath()).toBe(PATH);
  });

  it('shows the button pending while marking', async () => {
    renderScreen(PATH, { overrides: { review: 'pending' } });
    const button = await screen.findByRole('button', { name: 'Mark as reviewed' });

    fireEvent.click(button);

    expect(button.getAttribute('data-pending')).toBe('true');
  });

  it('titles an unnamed entity by its entity ID', async () => {
    renderScreen(PATH, { overrides: { comparison: { ...boardComparison, name: null } } });

    expect(await screen.findByRole('heading', { name: ENTITY })).toBeTruthy();
  });

  it('says so when the comparison cannot be loaded', async () => {
    renderScreen(PATH, { overrides: { failure: { status: 500, body: null } } });

    expect(await screen.findByText('Comparison not loaded: the server answered 500.')).toBeTruthy();
  });
});
