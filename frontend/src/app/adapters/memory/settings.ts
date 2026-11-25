import type { EditedEntity, Refusal } from '../../../domain/entities';
import { edited, MOODLE } from './edited';
import { moodleSaved } from './forms';
import { phpOf } from './translate';

// FormServiceProvider: Moodle on the edit screen, last seen in the Settings view.
export function settingsEntity(more: Partial<EditedEntity> = {}): EditedEntity {
  return edited({ php: phpOf(MOODLE, moodleSaved), document: moodleSaved, view: 'settings', ...more });
}

export const settingsRefusal: Refusal = {
  errors: [{ pointer: '/attributes.NameFormat', message: 'Not a URI the IdP understands.', line: 30, column: null }],
  notices: [],
  readable: true,
};
