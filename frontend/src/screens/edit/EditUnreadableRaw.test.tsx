import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EDIT, ENTITY, entity, session, stubApi } from '../../test/api';
import { renderAt } from '../../test/render';

describe('the edit screen of an unreadable entity', () => {
  it('shows the stored bytes of an unreadable entity as they are, read-only', async () => {
    const raw = '{oops "secret": "s3cr3t"}\n';
    stubApi({
      '/api/session': { body: session },
      [ENTITY]: { body: entity({ name: null, unreadable: true, php: null, error: 'Bad.', raw }) },
    });
    renderAt(EDIT);

    const bytes = await screen.findByLabelText('Stored bytes');

    expect(bytes.tagName).toBe('PRE');
    expect(bytes.textContent).toBe(raw);
  });
});
