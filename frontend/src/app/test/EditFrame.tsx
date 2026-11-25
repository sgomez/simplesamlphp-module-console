import { useState } from 'react';
import { expect, fireEvent, userEvent, within } from 'storybook/test';
import { EditServiceProviderPage } from '../../pages/EditServiceProviderPage';
import { memoryEntities, type MemoryEntities } from '../adapters/memory/entities';
import { MOODLE } from '../adapters/memory/edited';
import { StoryFrame } from './StoryFrame';

export interface EditFrameProps {
  entities: MemoryEntities;
  pending?: number;
  title?: string;
}

// The edit page of a page story, at its route, over in-memory ports.
export function EditFrame({ entities, pending = 0, title = 'Moodle' }: EditFrameProps) {
  const [port] = useState(() => memoryEntities(entities));

  return (
    <StoryFrame crumbs={[{ label: 'Service providers', to: '/entities/saml20-sp-remote' }, { label: title }]} pending={pending} entities={port}>
      <EditServiceProviderPage pending={pending} created={null} onSaved={() => undefined} onTitle={() => undefined} />
    </StoryFrame>
  );
}

export const EDIT_ROUTE = `/entities/saml20-sp-remote/edit?entityid=${encodeURIComponent(MOODLE)}`;

// Types at the end of the text and saves it.
export async function editAndSave(canvasElement: HTMLElement): Promise<void> {
  const page = within(canvasElement);
  const text = await page.findByRole('textbox', { name: 'PHP' });
  await userEvent.click(text);
  await userEvent.keyboard('{Control>}{End}{/Control} ');
  const save = page.getByRole('button', { name: 'Save' });
  await expect(save).toBeEnabled();
  // A click without focus: a focused button that stops pending leaves an announcement behind for the next story's axe check.
  fireEvent.click(save);
  text.blur();
}
