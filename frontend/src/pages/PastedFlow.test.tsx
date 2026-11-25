import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { edited, MOODLE } from '../app/adapters/memory/edited';
import { travelbookerXml } from '../app/adapters/memory/pastedBoards';
import { heldOne, heldReplacement, heldSeveral, SP_ADD, SP_REVIEW, SP_SEVERAL } from '../app/test/pasted';
import { renderScreen, screenPath } from '../app/test/screens';

const failing = { status: 500, body: null };
const REPLACE = `/entities/saml20-sp-remote/replace/review?entityid=${encodeURIComponent(MOODLE)}`;

describe('creating from pasted configuration', () => {
  it('reviews what was read and goes Back to the text it was read from', async () => {
    renderScreen(SP_ADD);
    fireEvent.change(await screen.findByRole('textbox', { name: 'Metadata XML or PHP array' }), { target: { value: travelbookerXml } });
    fireEvent.click(screen.getByRole('button', { name: 'Review' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Travelbooker' })).toBeTruthy();
    expect(screenPath()).toBe(SP_REVIEW);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByRole('textbox', { name: 'Metadata XML or PHP array' })).toHaveProperty('value', travelbookerXml);
  });

  it('lets the detected format be corrected', async () => {
    renderScreen(SP_ADD);
    fireEvent.change(await screen.findByRole('textbox', { name: 'Metadata XML or PHP array' }), { target: { value: travelbookerXml } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'PHP array' } });

    expect(screen.getByRole('combobox')).toHaveProperty('value', 'PHP array');
  });

  it('keeps the review when the save fails or is lost to another save', async () => {
    renderScreen(SP_REVIEW, { held: heldOne(), sets: { 'saml20-sp-remote': { save: () => ({ kind: 'failed', failed: failing }) } } });
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Not saved: the server answered 500.')).toBeTruthy();
  });

  it('says a replacement was saved by someone else since it was read', async () => {
    renderScreen(REPLACE, {
      held: heldReplacement(REPLACE),
      sets: { 'saml20-sp-remote': { entities: [edited()], save: (_draft, stored) => ({ kind: 'race', entity: stored ?? edited() }) } },
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Not saved: it was saved by someone else since it was read.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screenPath()).toBe(`/entities/saml20-sp-remote/edit?entityid=${encodeURIComponent(MOODLE)}`));
  });

  it('keeps the pick when several cannot be created', async () => {
    renderScreen(SP_SEVERAL, { held: heldSeveral, pasted: { failure: failing } });
    fireEvent.click(await screen.findByRole('button', { name: 'Create 2' }));

    expect(await screen.findByText('Not saved: the server answered 500.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(screenPath()).toBe(SP_ADD));
  });

  it('says a managed copy that cannot be read was not read', async () => {
    renderScreen('/external/saml20-sp-remote/copy?entityid=https%3A%2F%2Fnowhere.example.org&source=0');

    expect(await screen.findByText('Not read: the server answered 404.')).toBeTruthy();
  });

  it('keeps the confirmation when an Import fails', async () => {
    renderScreen('/external/import?set=saml20-sp-remote&id=0%3Ahttps%3A%2F%2Fjournals.publisher.example.com%2Fshibboleth', {
      overrides: { failure: failing },
    });

    expect(await screen.findByText('Not read: the server answered 500.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Import 0' })).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(screenPath()).toBe('/external'));
  });
});
