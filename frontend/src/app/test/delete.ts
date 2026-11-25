import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, expect, vi } from 'vitest';

export const DELETE = '/api/entities/saml20-sp-remote/delete';
export const ID = 'https://sp.example.org';
export const BAD = 'https://bad.example.org';
export const gone = { body: { entityid: ID } };

// jsdom has no modal dialogs.
export function withDialogs() {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    });
  });
}

// The entry acts once the menu has closed and handed the focus back.
export async function chooseDelete() {
  fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Delete…' }));
  await screen.findByRole('dialog');
}

// The confirming button, "Delete <name>", the entity ID standing for a missing name.
export function confirmDelete(name: string) {
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: `Delete ${name}` }));
}

export async function deletedMessage() {
  const message = await screen.findByRole('status');
  expect(message.className).toBe('callout callout-success');
  expect(message.textContent).toBe('Deleted.');
}
