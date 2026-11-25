import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { attention, boardOverview } from '../app/adapters/memory/overview';
import { renderScreen, screenPath } from '../app/test/screens';

describe('Overview', () => {
  it('links each line to the place that deals with it', async () => {
    renderScreen('/', { overview: { overview: { ...boardOverview, attention } } });

    await screen.findByRole('link', { name: 'idp-1 has problems' });
    const links = Object.fromEntries(screen.getAllByRole('link', { name: /: |idp-/ }).map((link) => [link.textContent, link.getAttribute('href')]));

    expect(links).toMatchObject({
      'idp-3 has not checked in for 12 min': '/nodes',
      'idp-1 has problems': '/nodes',
      'Moodle: certificate expires in 12 days': '/entities/saml20-sp-remote/edit?entityid=https%3A%2F%2Fmoodle.example.edu%2Fauth%2Fsaml2%2Fsp%2Fmetadata.php',
      'https://login.hospital.example.org/adfs/services/trust: certificate has expired':
        '/entities/saml20-idp-remote/edit?entityid=https%3A%2F%2Flogin.hospital.example.org%2Fadfs%2Fservices%2Ftrust',
      'Campus card: external source not reviewed': '/entities/saml20-sp-remote/override?entityid=https%3A%2F%2Fcard.example.edu%2Fsp',
    });
    expect(screen.getByRole('link', { name: /console:Snapshot is not in metadata.sources/ }).getAttribute('href')).toBe('/nodes');
  });

  it('leads from the first run to External entities', async () => {
    renderScreen('/', { overview: { overview: { ...boardOverview, current: null, counts: { 'saml20-sp-remote': 0, 'saml20-idp-remote': 0, 'saml20-idp-hosted': 0, authsources: 0 } } } });

    fireEvent.click(await screen.findByRole('link', { name: 'Import existing entities' }));

    await waitFor(() => expect(screenPath()).toBe('/external'));
  });

  it('says when it did not load', async () => {
    renderScreen('/', { overview: { failure: { status: 0, body: null } } });

    expect(await screen.findByText('Overview not loaded: the Console could not be reached.')).toBeTruthy();
  });
});
