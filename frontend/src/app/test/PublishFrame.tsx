import { useState } from 'react';
import { destroyAnnouncer } from 'react-aria/private/live-announcer/LiveAnnouncer';
import { userEvent, within } from 'storybook/test';
import { LiveSnapshot, type PublicationPort } from '../../domain/publication';
import { PublishPage } from '../../pages/PublishPage';
import { memoryPublication, type MemoryPublication } from '../adapters/memory/publication';
import { StoryFrame } from './StoryFrame';

export interface PublishFrameProps {
  publication: MemoryPublication;
  // The Snapshot the header shows live; null before the first Publication.
  live?: number | null;
  pending?: number;
  more?: Partial<PublicationPort>;
}

// The Publish page in the Console's chrome, over an in-memory publication port.
export function PublishFrame({ publication, live = 41, pending = 0, more }: PublishFrameProps) {
  const [port] = useState(() => ({ ...memoryPublication(publication), ...more }));
  const end = live === null ? null : <LiveSnapshot current={{ number: live, createdAt: null }} />;

  return (
    <StoryFrame crumbs={[{ label: 'Publish' }]} pending={pending} publication={port} end={end}>
      <PublishPage onChange={() => undefined} />
    </StoryFrame>
  );
}

export async function pressPublish(canvasElement: HTMLElement): Promise<void> {
  await userEvent.click(await within(canvasElement).findByRole('button', { name: /^Publish \d/ }));
}

// The pending Publish button leaves an announcement pointing at it once it is gone, which axe rejects.
export function silence(): void {
  destroyAnnouncer();
}
