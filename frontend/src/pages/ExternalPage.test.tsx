import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderScreen, screenPath } from '../app/test/screens';

describe('External entities', () => {
  it('pages one source and leaves the others on their first page', async () => {
    renderScreen('/external');

    fireEvent.click(await screen.findByRole('link', { name: 'Next' }));

    await waitFor(() => expect(screenPath()).toBe('/external?source=0&page=2'));
    expect(await screen.findByText('26 to 50 of 2,941')).toBeTruthy();
    expect(screen.getByText('Timetable')).toBeTruthy();
  });

  it('searches within the set and keeps the search when the set changes', async () => {
    renderScreen('/external');
    const search = await screen.findByRole('searchbox', { name: 'Search by name or entity ID' });

    fireEvent.change(search, { target: { value: ' partner ' } });
    fireEvent.submit(search.closest('form') as HTMLFormElement);
    await waitFor(() => expect(screenPath()).toBe('/external?q=partner'));
    fireEvent.change(screen.getByRole('combobox', { name: 'Set' }), { target: { value: 'Identity providers' } });

    await waitFor(() => expect(screenPath()).toBe('/external?set=saml20-idp-remote&q=partner'));
    expect(await screen.findByText('Partner university')).toBeTruthy();
  });

  it('counts ticks and unticks, and forgets them in another set', async () => {
    renderScreen('/external');
    const box = await screen.findByRole('checkbox', { name: 'Select Alumni portal' });

    fireEvent.click(box);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select E-journals' }));
    expect(screen.getByText('2 selected')).toBeTruthy();
    fireEvent.click(box);
    expect(screen.getByText('1 selected')).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox', { name: 'Set' }), { target: { value: 'Identity providers' } });

    await screen.findByText('Partner university');
    expect(screen.queryByText(/selected$/)).toBeNull();
  });

  it('opens an entity from its row', async () => {
    renderScreen('/external');

    fireEvent.click(await screen.findByRole('link', { name: /Timetable/ }));

    await waitFor(() => expect(screenPath()).toBe('/external/saml20-sp-remote?entityid=https%3A%2F%2Ftimetable.example.edu%2Fsp'));
    expect(await screen.findByRole('heading', { name: 'Timetable', level: 1 })).toBeTruthy();
  });

  it('says what did not load', async () => {
    renderScreen('/external/saml20-sp-remote?entityid=https%3A%2F%2Ftimetable.example.edu%2Fsp', { overrides: { failure: { status: 500, body: null } } });

    expect(await screen.findByText('External entity not loaded: the server answered 500.')).toBeTruthy();
  });

  it('names a set with no External entity', async () => {
    renderScreen('/external?set=saml20-idp-remote', { overrides: { sources: [] } });

    expect(await screen.findByRole('heading', { name: 'No External identity providers' })).toBeTruthy();
  });
});
