import { screen } from '@testing-library/react';
import type { EntityRow } from '../../domain/entities';
import { page, session, stubApi } from './api';
import { renderAt } from './render';

const LIST = '/entities/saml20-sp-remote';

// The row of the list that shows the entity.
export async function rowOf(entity: EntityRow): Promise<HTMLElement> {
  stubApi({ '/api/session': { body: session }, [`/api${LIST}`]: { body: page([entity]) } });
  renderAt(LIST);
  const id = await screen.findByTitle(entity.entityId);

  return id.closest('.row') as HTMLElement;
}
