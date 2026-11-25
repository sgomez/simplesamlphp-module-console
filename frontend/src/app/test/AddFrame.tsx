import { useState } from 'react';
import { userEvent, within } from 'storybook/test';
import { AddServiceProviderPage } from '../../pages/AddServiceProviderPage';
import { starter } from '../adapters/memory/added';
import { memoryEntities, type MemoryEntities } from '../adapters/memory/entities';
import { StoryFrame } from './StoryFrame';

export interface AddFrameProps {
  entities?: MemoryEntities;
  pending?: number;
}

// The add page of a page story, at its route, over in-memory ports.
export function AddFrame({ entities = {}, pending = 7 }: AddFrameProps) {
  const [port] = useState(() => memoryEntities({ starter, ...entities }));

  return (
    <StoryFrame crumbs={[{ label: 'Service providers', to: '/entities/saml20-sp-remote' }, { label: 'Add' }]} pending={pending} entities={port}>
      <AddServiceProviderPage onSaved={() => undefined} onTitle={() => undefined} onCreated={() => undefined} />
    </StoryFrame>
  );
}

export const ADD_ROUTE = '/entities/saml20-sp-remote/new';

// Pastes the text into the paste area, with the focus left elsewhere.
export async function paste(canvasElement: HTMLElement, text: string): Promise<void> {
  const area = await within(canvasElement).findByRole('textbox', { name: 'Metadata XML or PHP array' });
  await userEvent.click(area);
  await userEvent.paste(text);
  area.blur();
}
