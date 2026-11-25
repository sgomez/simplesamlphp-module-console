import { userEvent, within } from 'storybook/test';
import type { Held, PastedObject, Reading } from '../../domain/pasted';
import { hrSelfService, travelbooker, travelbookerXml } from '../adapters/memory/pastedBoards';
import { moodleReplacement, moodleXml, severalCandidates, severalPhp } from '../adapters/memory/pastedSeveral';

export const SP_ADD = '/entities/saml20-sp-remote/new';
export const SP_REVIEW = `${SP_ADD}/review`;
export const SP_SEVERAL = `${SP_ADD}/several`;
export const ENTITY_TEXT = 'Metadata XML or PHP array';

export function heldOne(object: PastedObject = travelbooker, at = SP_REVIEW): Held {
  return { at, text: object === hrSelfService ? hrSelfService.php : travelbookerXml, format: 'xml', reading: { kind: 'one', object } };
}

export const heldSeveral: Held = { at: SP_SEVERAL, text: severalPhp, format: 'php', reading: { kind: 'several', candidates: severalCandidates } };

export function heldReplacement(at: string): Held {
  const reading: Reading = { kind: 'replaced', replacement: moodleReplacement };

  return { at, text: moodleXml, format: 'xml', reading };
}

// Pastes the text into the text area named by label, with the focus left elsewhere.
export async function pasteInto(canvasElement: HTMLElement, label: string, text: string): Promise<void> {
  const area = await within(canvasElement).findByRole('textbox', { name: label });
  await userEvent.click(area);
  await userEvent.paste(text);
  area.blur();
}
