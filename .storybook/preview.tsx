import type { Preview } from '@storybook/react-vite';
import { destroyAnnouncer } from 'react-aria/private/live-announcer/LiveAnnouncer';
import { MemoryRouter } from 'react-router';
import '../frontend/src/console.css';
import { LinkRouter } from '../frontend/src/design-system/LinkRouter';

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
    options: { storySort: { order: ['Foundations', 'Design system', 'Domain', 'Pages'] } },
  },
  // A settled pending button leaves React Aria's announcement for seconds, which axe rejects in the next story.
  beforeEach: () => {
    destroyAnnouncer();
  },
  decorators: [
    (Story, { parameters }) => (
      <MemoryRouter initialEntries={[(parameters['route'] as string | undefined) ?? '/']}>
        <LinkRouter>
          <Story />
        </LinkRouter>
      </MemoryRouter>
    ),
  ],
};

export default preview;
